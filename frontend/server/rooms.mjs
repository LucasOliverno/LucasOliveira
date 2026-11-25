// Salas do MANDATO online: lobby, código de convite, partida autoritativa e bots.
// O servidor guarda o estado completo; cada jogador recebe só a sua projeção (ver src/mandato/online/view.js).
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import * as E from '../src/mandato/engine.js';
import { botStep } from '../src/mandato/bot.js';
import { CARDS, DURATIONS, DEFAULT_TARGET } from '../src/mandato/data.js';
import { viewFor } from '../src/mandato/online/view.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I
const BOT_NAMES = ['Bot Alfa', 'Bot Beta', 'Bot Gama', 'Bot Delta', 'Bot Épsilon'];
const MAX_SEATS = 6;
const MIN_SEATS = 2;
const MAX_ROOMS = 300;
const BOT_DELAY = Number(process.env.MANDATO_BOT_DELAY ?? 1100);
const CMDS = new Set(['pick', 'choose', 'play', 'playSimple', 'buy', 'build', 'wonder', 'demolish', 'sell', 'claim', 'seals', 'intrigue', 'decree', 'ability', 'end']);
const SIMPLE = (id) => CARDS[id] && (CARDS[id].type === 'basic' || id === 'P-02' || id === 'P-04');

const clean = (v, max = 20) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

export class Rooms {
  // file: onde guardar as salas (JSON). Com um volume persistente elas sobrevivem a reinícios e deploys.
  constructor({ file = null } = {}) {
    this.rooms = new Map();
    this.file = file;
    this.saveTimer = null;
    this.load();
    this.sweeper = setInterval(() => this.sweep(), 5 * 60 * 1000);
    this.sweeper.unref();
  }

  // ---------------------------------------------------------------- persistência
  dirty() {
    if (!this.file || this.saveTimer) return;
    this.saveTimer = setTimeout(() => { this.saveTimer = null; this.flush(); }, 1500);
    this.saveTimer.unref();
  }

  flush() {
    if (!this.file) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const rooms = [...this.rooms.values()].map((r) => ({
      code: r.code, opts: r.opts, game: r.game, touched: r.touched, chat: r.chat || [],
      seats: r.seats.map((s) => ({ name: s.name, bot: s.bot, level: s.level, token: s.token, host: s.host })),
    }));
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify({ v: 1, rooms }));
      renameSync(tmp, this.file);
    } catch (e) { console.error('não foi possível salvar as salas:', e.message); }
  }

  load() {
    if (!this.file || !existsSync(this.file)) return;
    try {
      const d = JSON.parse(readFileSync(this.file, 'utf8'));
      for (const x of d.rooms || []) {
        if (!x || !x.code || !Array.isArray(x.seats) || !x.seats.length) continue;
        const r = { code: x.code, opts: x.opts || { target: DEFAULT_TARGET, noIntrigues: false }, game: x.game || null, touched: x.touched || Date.now(), botTimer: null, chat: Array.isArray(x.chat) ? x.chat.slice(-60) : [], seats: x.seats.map((s) => ({ ...s, ws: null })) };
        this.rooms.set(r.code, r);
      }
      for (const r of this.rooms.values()) this.pump(r); // bots retomam a vez
      console.log(`salas restauradas: ${this.rooms.size}`);
    } catch (e) { console.error('não foi possível ler as salas salvas:', e.message); }
  }

  // ---------------------------------------------------------------- utilidades
  newCode() {
    for (let i = 0; i < 50; i++) {
      const b = randomBytes(6);
      const code = Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
      if (!this.rooms.has(code)) return code;
    }
    return null;
  }

  sweep() {
    const now = Date.now();
    for (const [code, r] of this.rooms) {
      const live = r.seats.some((s) => s.ws);
      const idle = now - r.touched;
      if (!live && (idle > 2 * 3600e3 || (r.game && r.game.over && idle > 30 * 60e3))) this.drop(code);
    }
  }

  drop(code) {
    const r = this.rooms.get(code);
    if (!r) return;
    clearTimeout(r.botTimer);
    this.rooms.delete(code);
    this.dirty();
  }

  lobbyMsg(r, seat) {
    return {
      t: 'lobby', code: r.code, you: seat, host: r.seats.findIndex((s) => s.host), opts: r.opts, started: !!r.game,
      seats: r.seats.map((s) => ({ name: s.name, bot: s.bot, level: s.bot ? s.level || 'normal' : undefined, online: s.bot || !!s.ws, host: !!s.host })),
    };
  }

  presence(r) { return r.seats.map((s) => s.bot || !!s.ws); }

  broadcast(r, botNote = null) {
    this.dirty();
    r.seats.forEach((s, i) => {
      if (!s.ws) return;
      if (r.game) send(s.ws, { t: 'state', code: r.code, you: i, view: viewFor(r.game, i), presence: this.presence(r), host: r.seats.findIndex((x) => x.host), botNote });
      else send(s.ws, this.lobbyMsg(r, i));
    });
  }

  attach(r, seat, ws) {
    const s = r.seats[seat];
    if (s.ws && s.ws !== ws) { s.ws.ctx = null; try { s.ws.close(4001, 'Conectado em outro lugar'); } catch { /* já fechado */ } }
    s.ws = ws;
    ws.ctx = { code: r.code, seat };
    r.touched = Date.now();
  }

  // ---------------------------------------------------------------- mensagens
  handle(ws, msg) {
    if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
    const ctx = ws.ctx;
    switch (msg.t) {
      case 'create': return this.create(ws, msg);
      case 'join': return this.join(ws, msg);
      case 'rejoin': return this.rejoin(ws, msg);
      case 'leave': return this.leave(ws);
      case 'lobby': return ctx ? this.lobbyAction(ws, ctx, msg) : send(ws, { t: 'error', msg: 'Entre numa sala primeiro.' });
      case 'cmd': return ctx ? this.command(ws, ctx, msg.cmd) : send(ws, { t: 'error', msg: 'Entre numa sala primeiro.' });
      case 'chat': return ctx ? this.chat(ws, ctx, msg.text) : undefined;
      default: return undefined;
    }
  }

  create(ws, msg) {
    if (ws.ctx) this.leave(ws);
    if (this.rooms.size >= MAX_ROOMS) return send(ws, { t: 'error', msg: 'Servidor cheio. Tente de novo em alguns minutos.' });
    const code = this.newCode();
    if (!code) return send(ws, { t: 'error', msg: 'Não foi possível criar a sala.' });
    const token = randomBytes(16).toString('hex');
    const r = { code, seats: [{ name: clean(msg.name) || 'Prefeito(a) 1', bot: false, token, ws: null, host: true }], opts: { target: DEFAULT_TARGET, noIntrigues: false }, game: null, botTimer: null, touched: Date.now(), chat: [] };
    this.rooms.set(code, r);
    this.attach(r, 0, ws);
    send(ws, { t: 'joined', code, token, seat: 0 });
    send(ws, { t: 'chatlog', list: r.chat });
    this.broadcast(r);
  }

  join(ws, msg) {
    const r = this.rooms.get(clean(msg.code, 8).toUpperCase());
    if (!r) return send(ws, { t: 'error', msg: 'Sala não encontrada. Confira o código.' });
    if (r.game) return send(ws, { t: 'error', msg: 'Essa partida já começou. Se você estava nela, use o mesmo navegador para voltar.' });
    if (r.seats.length >= MAX_SEATS) return send(ws, { t: 'error', msg: 'Sala cheia (6 jogadores).' });
    if (ws.ctx) this.leave(ws);
    const token = randomBytes(16).toString('hex');
    const name = clean(msg.name) || `Prefeito(a) ${r.seats.length + 1}`;
    r.seats.push({ name, bot: false, token, ws: null, host: false });
    this.attach(r, r.seats.length - 1, ws);
    send(ws, { t: 'joined', code: r.code, token, seat: r.seats.length - 1 });
    send(ws, { t: 'chatlog', list: r.chat || [] });
    this.broadcast(r);
  }

  rejoin(ws, msg) {
    const r = this.rooms.get(clean(msg.code, 8).toUpperCase());
    const seat = r ? r.seats.findIndex((s) => !s.bot && s.token && s.token === msg.token) : -1;
    if (!r || seat < 0) return send(ws, { t: 'gone', msg: 'Sala ou assento não existe mais.' });
    this.attach(r, seat, ws);
    send(ws, { t: 'joined', code: r.code, token: r.seats[seat].token, seat });
    send(ws, { t: 'chatlog', list: r.chat || [] });
    this.broadcast(r);
    this.pump(r);
  }

  leave(ws) {
    const ctx = ws.ctx;
    ws.ctx = null;
    if (!ctx) return;
    const r = this.rooms.get(ctx.code);
    if (!r) return;
    const s = r.seats[ctx.seat];
    if (!r.game) { // no lobby sair libera o assento
      r.seats.splice(ctx.seat, 1);
      r.seats.forEach((x, i) => { if (x.ws) x.ws.ctx = { code: r.code, seat: i }; });
      if (!r.seats.some((x) => !x.bot)) return this.drop(r.code);
      if (!r.seats.some((x) => x.host)) r.seats.find((x) => !x.bot).host = true;
    } else if (s) {
      s.ws = null;
    }
    this.broadcast(r);
  }

  // chamada quando a conexão cai (sem perder o assento)
  disconnected(ws) {
    const ctx = ws.ctx;
    if (!ctx) return;
    const r = this.rooms.get(ctx.code);
    if (!r) return;
    const s = r.seats[ctx.seat];
    if (s && s.ws === ws) s.ws = null; // o assento fica guardado: quem cair volta com o mesmo token
    this.broadcast(r);
  }

  lobbyAction(ws, ctx, msg) {
    const r = this.rooms.get(ctx.code);
    if (!r) return;
    const me = r.seats[ctx.seat];
    const err = (m) => send(ws, { t: 'error', msg: m });
    if (!me || !me.host) return err('Só o anfitrião pode fazer isso.');
    switch (msg.action) {
      case 'addBot': {
        if (r.game) return err('A partida já começou.');
        if (r.seats.length >= MAX_SEATS) return err('Sala cheia.');
        const used = new Set(r.seats.map((s) => s.name));
        r.seats.push({ name: BOT_NAMES.find((n) => !used.has(n)) || `Bot ${r.seats.length + 1}`, bot: true, level: 'normal', token: null, ws: null, host: false });
        break;
      }
      case 'botLevel': {
        if (r.game) return err('A partida já começou.');
        const b = r.seats[Number(msg.seat)];
        if (!b || !b.bot || !E.BOT_LEVELS.includes(msg.level)) return err('Nível inválido.');
        b.level = msg.level;
        break;
      }
      case 'remove': {
        if (r.game) return err('A partida já começou.');
        const i = Number(msg.seat);
        if (!r.seats[i] || r.seats[i].host) return err('Não dá para remover esse assento.');
        const [gone] = r.seats.splice(i, 1);
        if (gone.ws) { send(gone.ws, { t: 'gone', msg: 'O anfitrião removeu você da sala.' }); gone.ws.ctx = null; }
        r.seats.forEach((x, k) => { if (x.ws) x.ws.ctx = { code: r.code, seat: k }; });
        break;
      }
      case 'opts': {
        if (r.game) return err('A partida já começou.');
        const target = Number(msg.target);
        if (DURATIONS.some((d) => d.target === target)) r.opts.target = target;
        if (typeof msg.noIntrigues === 'boolean') r.opts.noIntrigues = msg.noIntrigues;
        break;
      }
      case 'botify': { // assume o lugar de quem não voltou, para a mesa não travar
        const i = Number(msg.seat);
        const s = r.seats[i];
        if (!r.game || !s || s.bot || s.ws) return err('Esse jogador está conectado ou não existe.');
        s.bot = true;
        s.token = null;
        r.game.players[i].bot = true;
        break;
      }
      case 'rematch': { // depois do fim: volta todos para a sala de espera, com os mesmos assentos
        if (!r.game || !r.game.over) return err('A partida ainda não terminou.');
        clearTimeout(r.botTimer);
        r.botTimer = null;
        r.game = null;
        this.say(r, null, 'Revanche! O anfitrião abriu a sala de novo.');
        break;
      }
      case 'start': {
        if (r.game) return err('A partida já começou.');
        if (r.seats.length < MIN_SEATS) return err('Precisa de pelo menos 2 prefeitos (adicione bots se quiser).');
        this.start(r);
        break;
      }
      default: return undefined;
    }
    r.touched = Date.now();
    this.broadcast(r);
    if (r.game) this.pump(r);
    return undefined;
  }

  say(r, seat, text) {
    const s = seat == null ? null : r.seats[seat];
    const m = { seat, name: s ? s.name : 'Mesa', text, ts: Date.now() };
    r.chat = r.chat || [];
    r.chat.push(m);
    if (r.chat.length > 60) r.chat.splice(0, r.chat.length - 60);
    r.seats.forEach((x) => send(x.ws, { t: 'chat', msg: m }));
    this.dirty();
  }

  chat(ws, ctx, text) {
    const r = this.rooms.get(ctx.code);
    if (!r || !r.seats[ctx.seat]) return;
    const msg = String(text ?? '').replace(/[ -]/g, ' ').trim().slice(0, 240);
    if (!msg) return;
    const now = Date.now();
    ws.chatT = (ws.chatT || []).filter((x) => now - x < 10000);
    if (ws.chatT.length >= 8) return send(ws, { t: 'error', msg: 'Calma: muitas mensagens seguidas.' });
    ws.chatT.push(now);
    r.touched = now;
    this.say(r, ctx.seat, msg);
  }

  start(r) {
    // ordem de assentos sorteada: o assento define a posição na mesa e o Pacote de Posição
    for (let i = r.seats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r.seats[i], r.seats[j]] = [r.seats[j], r.seats[i]];
    }
    r.seats.forEach((s, i) => { if (s.ws) s.ws.ctx = { code: r.code, seat: i }; });
    r.game = E.newGame({ players: r.seats.map((s) => ({ name: s.name, bot: s.bot, botLevel: s.level })), target: r.opts.target, noIntrigues: r.opts.noIntrigues });
  }

  command(ws, ctx, cmd) {
    const r = this.rooms.get(ctx.code);
    const err = (m) => send(ws, { t: 'error', msg: m });
    if (!r || !r.game) return err('A partida ainda não começou.');
    if (!cmd || typeof cmd !== 'object' || !CMDS.has(cmd.t)) return err('Comando inválido.');
    if (r.game.over) return err('A partida terminou.');
    if (E.actor(r.game) !== ctx.seat) return err('Não é a sua vez.');
    let res;
    if (cmd.t === 'playSimple') {
      let st = r.game;
      let n = 0;
      for (let g = 0; g < 12; g++) {
        const hi = st.players[ctx.seat].hand.findIndex(SIMPLE);
        if (hi < 0) break;
        const x = E.apply(st, { t: 'play', hi });
        if (x.error) break;
        st = x.state;
        n++;
      }
      if (!n) return err('Nenhuma carta simples na mão.');
      res = { state: st };
    } else {
      res = E.apply(r.game, JSON.parse(JSON.stringify(cmd)));
      if (res.error) return err(res.error);
    }
    r.game = res.state;
    r.touched = Date.now();
    this.broadcast(r);
    this.pump(r);
    return undefined;
  }

  // bots jogam um de cada vez, com pausa, para a mesa acompanhar
  pump(r) {
    if (r.botTimer || !r.game || r.game.over) return;
    const who = E.actor(r.game);
    if (who == null || !r.game.players[who].bot) return;
    r.botTimer = setTimeout(() => {
      r.botTimer = null;
      if (!this.rooms.has(r.code) || !r.game) return;
      const out = botStep(r.game);
      if (out.who == null) return;
      r.game = out.state;
      r.touched = Date.now();
      this.broadcast(r, { who: out.who, lines: out.lines.slice(-4).map((l) => l.msg) });
      this.pump(r);
    }, BOT_DELAY);
  }
}
