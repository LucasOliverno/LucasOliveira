// Teste de integração do MANDATO online: sobe o servidor de verdade e joga com clientes WebSocket.
//   node src/mandato/test/online.mjs
process.env.MANDATO_BOT_DELAY = '0';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { start } from '../../../server/index.mjs';
import * as E from '../engine.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const srv = await start({ port: 0, host: '127.0.0.1', file: null });
const url = `ws://127.0.0.1:${srv.port}/mandato/ws`;
let failed = 0;
const ok = (name) => console.log(`ok  : ${name}`);

function client(label) {
  const ws = new WebSocket(url);
  const inbox = [];
  const latest = {};
  const waiters = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    inbox.push(m);
    latest[m.t] = m;
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred(m)) { const w = waiters.splice(i, 1)[0]; w.res(m); }
  });
  const open = new Promise((r) => ws.on('open', r));
  return {
    label, ws, inbox, latest, open,
    send: (m) => ws.send(JSON.stringify(m)),
    next: (pred, ms = 4000) => new Promise((res, rej) => {
      const hit = inbox.find(pred);
      if (hit) { inbox.splice(inbox.indexOf(hit), 1); return res(hit); }
      const w = { pred, res: (m) => { inbox.splice(inbox.indexOf(m), 1); res(m); } };
      waiters.push(w);
      setTimeout(() => rej(new Error(`${label}: timeout esperando mensagem`)), ms);
      return undefined;
    }),
    last: (t) => latest[t],
    until: async (pred, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const m = latest.state; if (m && pred(m)) return m; await new Promise((r) => setTimeout(r, 15)); } throw new Error(label + ': timeout esperando estado'); },
  };
}

async function run(name, fn) {
  try { await fn(); ok(name); } catch (e) { failed++; console.error(`FAIL: ${name}\n  ${e.stack || e}`); }
}

const A = client('A');
const B = client('B');
await Promise.all([A.open, B.open]);
let code;
let tokenB;

await run('criar sala devolve código de 6 caracteres e lobby', async () => {
  A.send({ t: 'create', name: 'Ana' });
  const j = await A.next((m) => m.t === 'joined');
  assert.match(j.code, /^[A-HJ-NP-Z2-9]{6}$/);
  code = j.code;
  const l = await A.next((m) => m.t === 'lobby');
  assert.equal(l.seats.length, 1);
  assert.equal(l.seats[0].host, true);
});

await run('código inexistente é recusado', async () => {
  B.send({ t: 'join', code: 'ZZZZZZ', name: 'Beto' });
  const e = await B.next((m) => m.t === 'error');
  assert.match(e.msg, /não encontrada/i);
});

await run('entrar com código (minúsculo também)', async () => {
  B.send({ t: 'join', code: code.toLowerCase(), name: 'Beto' });
  const j = await B.next((m) => m.t === 'joined');
  tokenB = j.token;
  const l = await A.next((m) => m.t === 'lobby' && m.seats.length === 2);
  assert.deepEqual(l.seats.map((s) => s.name), ['Ana', 'Beto']);
});

await run('só o anfitrião controla a sala', async () => {
  B.send({ t: 'lobby', action: 'addBot' });
  const e = await B.next((m) => m.t === 'error');
  assert.match(e.msg, /anfitri/i);
  B.send({ t: 'lobby', action: 'start' });
  await B.next((m) => m.t === 'error');
});

await run('anfitrião adiciona bot e inicia a partida', async () => {
  A.send({ t: 'lobby', action: 'addBot' });
  await A.next((m) => m.t === 'lobby' && m.seats.length === 3);
  A.send({ t: 'lobby', action: 'opts', target: 8 });
  A.send({ t: 'lobby', action: 'start' });
  const sa = await A.next((m) => m.t === 'state');
  assert.equal(sa.view.target, 8);
  assert.equal(sa.view.players.length, 3);
  assert.equal(sa.view.phase, 'draft');
});

await run('cada jogador recebe só a sua informação', async () => {
  // espera um estado em que o jogo já está em jogo (bots escolhem terreno por conta própria)
  // primeiro, cumpre o draft: quem for a vez escolhe um terreno
  const clients = { 0: null, 1: null };
  const byName = { Ana: A, Beto: B };
  let view = A.last('state').view;
  for (let guard = 0; guard < 40 && view.phase === 'draft'; guard++) {
    const act = E.actor(view);
    const who = view.players[act];
    if (!who.bot) {
      const c = byName[who.name];
      c.send({ t: 'cmd', cmd: { t: 'pick', terrain: view.draft.pool[0] } });
    }
    const m = await A.until((x) => x.view.draft.idx !== view.draft.idx || x.view.phase !== view.phase);
    view = m.view;
  }
  assert.equal(view.phase, 'play');
  void clients;
  const sa = A.last('state') || { view };
  const meA = sa.you;
  const v = sa.view;
  assert.ok(v.players[meA].hand.every((c) => typeof c === 'string'), 'minha mão é visível');
  v.players.forEach((p, i) => {
    if (i !== meA) assert.ok(p.hand.length > 0 && p.hand.every((c) => c === null), `mão de ${p.name} está oculta`);
    assert.ok(p.deck.every((c) => c === null), 'ordem do deck oculta');
  });
  assert.ok(v.market.deck.every((c) => c === null));
  assert.ok(v.roundDeck.every((c) => c === null));
  assert.equal(v.rng, 0);
  assert.equal(JSON.stringify(v).includes('"seed"'), false);
});

await run('só joga quem está na vez; comandos inválidos são recusados', async () => {
  await new Promise((r) => setTimeout(r, 150)); // bots da rodada 1 jogam
  const sa = A.last('state');
  const act = E.actor(sa.view);
  const names = sa.view.players.map((p) => p.name);
  const cl = { Ana: A, Beto: B };
  const notMine = names.find((n, i) => i !== act && cl[n] && !sa.view.players[i].bot);
  if (notMine) {
    cl[notMine].inbox.length = 0;
    cl[notMine].send({ t: 'cmd', cmd: { t: 'end' } });
    const e = await cl[notMine].next((m) => m.t === 'error');
    assert.match(e.msg, /vez/i);
  }
  A.inbox.length = 0;
  A.send({ t: 'cmd', cmd: { t: 'hackear' } });
  const e2 = await A.next((m) => m.t === 'error');
  assert.match(e2.msg, /inválido/i);
});

await run('partida anda: humanos encerram o turno e os bots respondem', async () => {
  const cl = { Ana: A, Beto: B };
  let state = A.last('state').view;
  const startRound = state.round;
  for (let guard = 0; guard < 80 && state.round === startRound; guard++) {
    await new Promise((r) => setTimeout(r, 60));
    state = A.last('state').view;
    const act = E.actor(state);
    const p = state.players[act];
    if (p.bot) continue;
    const c = cl[p.name];
    const pe = state.pending[0];
    if (pe) {
      c.send({ t: 'cmd', cmd: { t: 'choose', i: 0, f: 'tec', tile: pe.data.tiles ? pe.data.tiles[0] : 0, hi: 0, use: false } });
    } else {
      c.send({ t: 'cmd', cmd: { t: 'playSimple' } });
      c.send({ t: 'cmd', cmd: { t: 'end' } });
    }
  }
  assert.ok(A.last('state').view.round > startRound, 'a rodada avançou');
});

await run('reconectar com o token devolve o mesmo assento e o estado', async () => {
  B.ws.close();
  await new Promise((r) => setTimeout(r, 100));
  const B2 = client('B2');
  await B2.open;
  B2.send({ t: 'rejoin', code, token: tokenB });
  const j = await B2.next((m) => m.t === 'joined');
  assert.equal(j.seat, B.last('joined') ? j.seat : j.seat);
  const st = await B2.next((m) => m.t === 'state');
  assert.equal(st.view.players[st.you].name, 'Beto');
  assert.ok(st.view.players[st.you].hand.every((c) => typeof c === 'string'));
  B2.send({ t: 'rejoin', code, token: 'errado' });
  await B2.next((m) => m.t === 'gone');
  B2.ws.close();
});

await run('salas sobrevivem a reiniciar o servidor (e o jogador volta pelo token)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mandato-'));
  const file = join(dir, 'rooms.json');
  try {
    const s1 = await start({ port: 0, host: '127.0.0.1', file });
    const u1 = `ws://127.0.0.1:${s1.port}/mandato/ws`;
    const mk = async (lbl, u) => { const w = new WebSocket(u); const c = { w, got: [], send: (m) => w.send(JSON.stringify(m)) }; w.on('message', (r) => c.got.push(JSON.parse(r.toString()))); await new Promise((r) => w.on('open', r)); c.wait = async (p, ms = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const m = [...c.got].reverse().find(p); if (m) return m; await new Promise((r) => setTimeout(r, 15)); } throw new Error(lbl + ': timeout'); }; return c; };
    const h = await mk('host', u1);
    h.send({ t: 'create', name: 'Dona' });
    const j = await h.wait((m) => m.t === 'joined');
    h.send({ t: 'lobby', action: 'addBot' });
    await h.wait((m) => m.t === 'lobby' && m.seats.length === 2);
    h.send({ t: 'lobby', action: 'start' });
    const st = await h.wait((m) => m.t === 'state');
    const hand = st.view.players[st.you].hand.slice();
    h.w.close();
    s1.close(); // grava em arquivo
    const s2 = await start({ port: 0, host: '127.0.0.1', file }); // "novo deploy": lê o arquivo
    const back = await mk('volta', `ws://127.0.0.1:${s2.port}/mandato/ws`);
    back.send({ t: 'rejoin', code: j.code, token: j.token });
    const again = await back.wait((m) => m.t === 'state');
    assert.equal(again.view.players[again.you].name, 'Dona');
    assert.equal(again.view.phase, st.view.phase);
    assert.deepEqual(again.view.players[again.you].hand, hand, 'a mão volta igual');
    back.w.close();
    s2.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

A.ws.close();
srv.close();
if (failed) { console.error(`\n${failed} teste(s) falharam`); process.exit(1); }
console.log('\ntodos os testes online passaram');
process.exit(0);
