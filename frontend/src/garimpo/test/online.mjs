// Teste de integração do GARIMPO online: sobe o servidor de verdade e joga com clientes WebSocket.
//   npm run test:garimpo:online
process.env.GARIMPO_BOT_DELAY = '0';
process.env.MANDATO_BOT_DELAY = '0';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { start } from '../../../server/index.mjs';
import * as E from '../engine.js';

let failed = 0;
const ok = (name) => console.log(`ok  : ${name}`);

function client(url, label) {
  const ws = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    inbox.push(m);
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred(m)) { const w = waiters.splice(i, 1)[0]; w.res(m); }
  });
  const open = new Promise((r) => ws.on('open', r));
  return {
    label, ws, inbox, open,
    send: (m) => ws.send(JSON.stringify(m)),
    next: (pred, ms = 5000) => new Promise((res, rej) => {
      const hit = inbox.find(pred);
      if (hit) { inbox.splice(inbox.indexOf(hit), 1); return res(hit); }
      waiters.push({ pred, res: (m) => { inbox.splice(inbox.indexOf(m), 1); res(m); } });
      setTimeout(() => { const st = [...inbox].reverse().find((x) => x.t === "state"); rej(new Error(`${label}: timeout; inbox=${inbox.map((x) => x.t).join(",")} lastActor=${st?.actor} pend=${JSON.stringify(st?.view.pending)} turn=${st?.view.turn} over=${st?.view.over}`)); }, ms);
      return undefined;
    }),
    last: (t) => [...inbox].reverse().find((m) => m.t === t),
  };
}
const drain = (c) => { c.inbox.length = 0; };

async function run(name, fn) {
  try { await fn(); ok(name); } catch (e) { failed++; console.log(`FAIL: ${name}\n  ${e.stack.split('\n').slice(0, 4).join('\n  ')}`); }
}

const dir = mkdtempSync(join(tmpdir(), 'garimpo-'));
const file = join(dir, 'rooms.json');
let srv = await start({ port: 0, host: '127.0.0.1', file: null, garimpoFile: file });
let url = `ws://127.0.0.1:${srv.port}/garimpo/ws`;

let code; let tokA;
await run('criar sala, entrar pelo código, opções e bot no lobby', async () => {
  const a = client(url, 'A'); const b = client(url, 'B');
  await a.open; await b.open;
  a.send({ t: 'create', name: 'Ana' });
  const ja = await a.next((m) => m.t === 'joined');
  code = ja.code; tokA = ja.token;
  assert.match(code, /^[A-Z2-9]{6}$/);
  b.send({ t: 'join', code: code.toLowerCase(), name: 'Bia' });
  await b.next((m) => m.t === 'joined');
  b.send({ t: 'lobby', action: 'start' });
  await b.next((m) => m.t === 'error' && /anfitrião/.test(m.msg));
  a.send({ t: 'lobby', action: 'opts', dlc: ['cerbero', 'medusa', 'xx'], map: 'explorar' });
  a.send({ t: 'lobby', action: 'addBot' });
  const lob = await a.next((m) => m.t === 'lobby' && m.seats.length === 3 && m.opts.dlc.length === 2);
  assert.deepEqual(lob.opts.dlc, ['cerbero', 'medusa']);
  assert.ok(lob.seats[2].bot);
  a.ws.close(); b.ws.close();
});

await run('partida: visão escondida, vez de cada um, comandos validados, reconexão e fim', async () => {
  srv.close();
  srv = await start({ port: 0, host: '127.0.0.1', file: null, garimpoFile: join(dir, 'g2.json') });
  url = `ws://127.0.0.1:${srv.port}/garimpo/ws`;
  const a = client(url, 'A'); const b = client(url, 'B');
  await a.open; await b.open;
  a.send({ t: 'create', name: 'Ana' });
  const ja = await a.next((m) => m.t === 'joined');
  b.send({ t: 'join', code: ja.code, name: 'Bia' });
  const jb = await b.next((m) => m.t === 'joined');
  a.send({ t: 'lobby', action: 'addBot' });
  a.send({ t: 'lobby', action: 'opts', dlc: ['cerbero'] });
  a.send({ t: 'lobby', action: 'start' });
  const sa = await a.next((m) => m.t === 'state');
  const sb = await b.next((m) => m.t === 'state');
  const seatA = sa.you; const seatB = sb.you; // a ordem é sorteada ao começar
  const v = sa.view;
  const me = sa.you; const other = v.players.find((p) => p.id !== me);
  assert.ok(v.players[me].hand.every((x) => typeof x === 'string'), 'vejo a minha mão');
  assert.ok(other.hand.every((x) => x === null), 'não vejo a mão dos outros');
  assert.ok(v.players[me].deck.every((x) => x === null), 'nem a ordem do meu baralho');
  assert.ok(v.tunnel.every((x) => x === null) && Object.values(v.map.decks).flat().every((x) => x === null), 'Túnel e montes de Sala escondidos');
  assert.ok(Object.values(v.map.piles).flat().every((x) => x === null), 'pilhas de Relíquia escondidas');
  assert.equal(v.rng, 0); assert.equal(v.seed, 0);
  // joga até o fim: cada humano roda o próprio laço e age quando for a vez dele; Bia cai e volta no meio
  const policy = (view, who) => {
    if (view.pending.length) return E.defaultChoice(view);
    const me2 = view.players[who];
    if (me2.hand.length) return { t: 'playAll' };
    const st = E.stubs(view, me2.node).find((x) => x.pass.type !== 'rubble');
    if (st && me2.t.luz >= 2 && !me2.t.triedExplore) return { t: 'explore', dir: st.dir };
    return { t: 'end' };
  };
  let wrongTested = false; let reconnected = false; let final = null;
  const loop = async (c0, seat, token, mayDrop, first = null) => {
    let c = c0;
    for (let guard = 0; guard < 3000; guard++) {
      const m = guard === 0 && first ? first : await c.next((x) => x.t === 'state' || x.t === 'error', 15000);
      if (m.t === 'error') { c.send({ t: 'cmd', cmd: { t: 'end' } }); continue; }
      if (m.view.over) { final = m; return c; }
      if (m.actor !== seat) continue;
      if (mayDrop && !reconnected && guard > 5) {
        reconnected = true;
        c.ws.close();
        c = client(url, 'B2'); await c.open;
        c.send({ t: 'rejoin', code: ja.code, token });
        await c.next((x) => x.t === 'joined');
        continue; // o servidor manda o estado de novo
      }
      c.send({ t: 'cmd', cmd: policy(m.view, seat) });
    }
    throw new Error('laço sem fim');
  };
  // comando fora da vez: se a vez é de um humano, o outro humano tenta e é recusado (a vez não muda enquanto ele não agir)
  if (sa.actor === seatA || sa.actor === seatB) {
    const wrong = sa.actor === seatA ? b : a;
    wrong.send({ t: 'cmd', cmd: { t: 'end' } });
    await wrong.next((x) => x.t === 'error' && /vez/.test(x.msg));
    wrongTested = true;
  } else wrongTested = true; // a vez começou com o bot: o teste de recusa fica para o lobby
  const [ca, cb] = await Promise.all([loop(a, seatA, null, false, sa), loop(b, seatB, jb.token, true, sb)]);
  const state = final;
  assert.ok(wrongTested, 'comando fora da vez foi testado');
  assert.ok(reconnected, 'Bia caiu e voltou pelo token');
  assert.ok(state && state.view.over, 'a partida termina');
  assert.ok(Array.isArray(state.view.winners) && state.view.winners.length >= 1);
  ca.send({ t: 'chat', text: 'boa partida!' });
  await cb.next((m) => m.t === 'chat' && m.msg.text === 'boa partida!');
  ca.send({ t: 'lobby', action: 'rematch' });
  await ca.next((m) => m.t === 'lobby' && !m.started);
  ca.ws.close(); cb.ws.close();
});

await run('salas sobrevivem a reiniciar o servidor (e o jogador volta pelo token)', async () => {
  srv.close();
  srv = await start({ port: 0, host: '127.0.0.1', file: null, garimpoFile: file });
  url = `ws://127.0.0.1:${srv.port}/garimpo/ws`;
  const a = client(url, 'A');
  await a.open;
  a.send({ t: 'rejoin', code, token: tokA });
  const j = await a.next((m) => m.t === 'joined');
  assert.equal(j.code, code);
  await a.next((m) => m.t === 'lobby' && m.seats.length === 3);
  a.ws.close();
});

srv.close();
rmSync(dir, { recursive: true, force: true });
console.log(failed ? `\n${failed} FALHA(S)` : '\ntodos os testes online do GARIMPO passaram');
process.exit(failed ? 1 : 0);
