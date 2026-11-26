// GARIMPO — bot heurístico. Joga um turno inteiro pelo jogador da vez usando só exec() (não trapaceia).
// Mapa de exploração: o bot só conhece as salas já descobertas e as saídas que dão para o escuro.
import * as E from './engine.js';
import { CARDS, RELICS, MASCATE, DLCS } from './data.js';
import { BOCA, BARRACAO_NODE, FIXED } from './data.js';

export const BOT_OPTS = { greed: 1, risk: 1 };
const BUY_MIN = +(globalThis.process?.env?.BUY_MIN ?? 1.5);

// arcos dirigidos com custo de planejamento (🔦) para o jogador p
function arcs(s, p, extraRelic = 0) {
  const out = [];
  const fake = { ...p, relics: [...p.relics, ...Array(extraRelic).fill('R30')] };
  for (const e of s.map.edges) {
    for (const [u, v] of [[e.a, e.b], [e.b, e.a]]) {
      if (e.type === 'shaft' && u !== e.a) continue;
      const c = E.moveCost(s, fake, u, v);
      let w;
      if (c.err) {
        if (!s.rubble.includes(e.key)) continue;
        w = 4; // desabamento: dá para limpar com ⛏3, mas custa caro
      } else {
        w = c.luz;
        if (c.prosa) w += p.t.prosa >= c.prosa ? 0.5 : 3;
        if (c.den) w += 0.5;
        w += c.est * 0.3;
      }
      if (s.grisu.includes(v)) w += 1.5;
      if (s.cerb && s.cerb.awake > 0 && s.cerb.node === v) w += 3;
      out.push({ u, v, w });
    }
  }
  return out;
}
// distância de cada nó até o alvo
function distTo(s, p, target, extraRelic = 0) {
  const ids = E.nodeIds(s);
  const A = arcs(s, p, extraRelic);
  const d = Object.fromEntries(ids.map((n) => [n, Infinity]));
  d[target] = 0;
  const done = new Set();
  for (;;) {
    let n = null;
    for (const k of ids) if (!done.has(k) && d[k] < Infinity && (n === null || d[k] < d[n])) n = k;
    if (n === null) break;
    done.add(n);
    for (const a of A) if (a.v === n && d[n] + a.w < d[a.u]) d[a.u] = d[n] + a.w;
  }
  return d;
}
const lv = (s, n) => E.lvOf(s, n);

// Alvo: { node, dir? } — dir = explorar por essa saída ao chegar no nó
// Joga como um humano no Clank: não foge cedo com tesouro barato; enquanto dá, explora e compra.
export const LEAVE = { round: +(globalThis.process?.env?.LEAVE_ROUND ?? 12), fury: 5, folego: 4, goodRelic: 20, cheapEarly: 15, earlyRound: +(globalThis.process?.env?.EARLY_ROUND ?? 9) };
function shouldLeave(s, p, backTurns) {
  if (!p.relics.length) return false;
  if (p.relics.length >= E.relicCap(p) && E.relicCap(p) === 1 && RELICS[p.relics[0]].pts >= LEAVE.goodRelic) return true;
  if (s.water !== null) return true;
  if (p.folego <= LEAVE.folego) return true;
  if (s.fury >= LEAVE.fury) return true;
  if (s.turnNo + backTurns >= LEAVE.round) return true;
  return false;
}
function chooseTarget(s, p) {
  const carrying = p.relics.length;
  const cap = E.relicCap(p);
  const luzPerTurn = 3;
  const greed = p.greed ?? BOT_OPTS.greed;
  const danger = (l) => l * (0.4 + s.fury * 0.2) * BOT_OPTS.risk;
  const backFrom = distTo(s, p, BOCA, carrying + 1);
  const backTurns = (distTo(s, p, BOCA, carrying)[p.node] || 0) / luzPerTurn;
  if (shouldLeave(s, p, backTurns)) return { node: BOCA };
  const fromMe = distTo(s, p, p.node); // simétrico o bastante para estimar a ida
  const canTrip = (there, back) => {
    const turns = (there + back) / luzPerTurn;
    if (p.folego - turns * (0.3 + s.fury * 0.1) < 2) return false;
    if (s.water !== null && turns > s.water - 1.5) return false;
    return true;
  };
  let best = null; let bestV = -Infinity;
  if (carrying < cap) {
    for (const [n, r] of Object.entries(s.relics)) {
      const there = distTo(s, p, n)[p.node];
      if (there === Infinity || !canTrip(there, backFrom[n])) continue;
      const pts = RELICS[r].pts;
      let v = pts * greed - (there + backFrom[n]) * 1.0 - danger(lv(s, n));
      if (carrying) v -= 8;
      // no começo, tesouro barato prende a mão (só se carrega 1): melhor esperar algo melhor
      if (!carrying && s.water === null && s.turnNo < LEAVE.earlyRound && pts < LEAVE.cheapEarly) v -= 14;
      if (v > bestV) { bestV = v; best = { node: n }; }
    }
  }
  // explorar: saídas para o escuro (valor esperado cresce com a profundidade)
  if (s.map.mode === 'explorar') {
    for (const n of E.nodeIds(s)) {
      const sts = E.stubs(s, n);
      if (!sts.length) continue;
      const there = fromMe[n];
      if (there === Infinity) continue;
      for (const st of sts) {
        if (st.pass.type === 'rubble' && p.t.pic < 3 && !p.t.dyn) continue;
        const c = E.exploreCost(s, { ...p, node: n }, st.dir);
        if (c.err && st.pass.type !== 'rubble') continue;
        const step = c.luz ?? 3;
        if (!canTrip(there + step, backFrom[n] + 2)) continue;
        let v = greed * (5 + 3.2 * st.lv) + (st.dir === 'D' ? 2 : 0) - (there + step) * 1.1 - danger(st.lv) - backFrom[n] * 0.35;
        if (carrying >= cap) v = 4 + st.lv - (there + step) * 1.2 - backFrom[n] * 0.5; // já tem relíquia: explora perto, atrás de ouro e cristal
        if (v > bestV) { bestV = v; best = { node: n, dir: st.dir }; }
      }
    }
  }
  // Geodos e Veios ainda não visitados
  for (const n of E.nodeIds(s)) {
    const k = E.kindOf(s, n);
    if (p.visited.includes(n) || !((k === 'geodo' && s.crystals[n] > 0) || k === 'veio')) continue;
    const there = fromMe[n];
    if (there === Infinity || !canTrip(there, backFrom[n])) continue;
    const v = (k === 'geodo' ? 6 : 3) - there * 1.0 - danger(lv(s, n)) * 0.5;
    if (v > bestV) { bestV = v; best = { node: n }; }
  }
  if (best) return best;
  return { node: BOCA };
}

const ex = (s, a) => E.exec(s, a);

function settle(s) {
  for (let g = 0; g < 20 && s.pending.length; g++) ex(s, E.defaultChoice(s));
}

function onNode(s, p, target) {
  const t = p.t;
  if (s.relics[p.node] && p.relics.length < E.relicCap(p) && (p.node === target.node || RELICS[s.relics[p.node]].pts >= 15)) ex(s, { t: 'take' });
  if (E.kindOf(s, p.node) === 'mascate' && !t.mascate) {
    const want = [];
    if (p.folego <= 5) want.push('cantil');
    if (!p.relics.length) want.push('mochila', 'capacete');
    else want.push('corda', 'capacete');
    for (const k of want) if (p.gold >= MASCATE[k].gold && s.mascate[k] > 0 && !E.hasItem(p, k)) { if (!ex(s, { t: 'mascate', item: k })) break; }
  }
  if (p.node === BARRACAO_NODE && p.folego < 10 && t.prosa >= 2) ex(s, { t: 'rest' });
}

function moveLoop(s, p) {
  for (let g = 0; g < 40 && E.inMine(p) && !s.over && !s.pending.length; g++) {
    const target = chooseTarget(s, p);
    onNode(s, p, target);
    settle(s);
    if (!E.inMine(p) || s.over) return;
    if (p.node === target.node) {
      if (target.dir) {
        const st = E.stubs(s, p.node).find((x) => x.dir === target.dir);
        if (st?.pass.type === 'rubble') { if (ex(s, { t: 'clear', dir: target.dir })) return; continue; }
        if (ex(s, { t: 'explore', dir: target.dir })) return;
        settle(s);
        continue;
      }
      const again = chooseTarget(s, p);
      if (again.node === p.node && !again.dir) return;
      continue;
    }
    const d = distTo(s, p, target.node);
    // limpar desabamento ao lado se encurta o caminho
    for (const k of [...s.rubble]) {
      const e = s.map.edges.find((x) => x.key === k);
      if (e && (e.a === p.node || e.b === p.node) && (p.t.dyn > 0 || p.t.pic >= 3)) {
        const other = e.a === p.node ? e.b : e.a;
        if (d[other] + 1 < d[p.node]) ex(s, { t: 'clear', edge: k });
      }
    }
    const d2 = distTo(s, p, target.node);
    // trilho
    const rides = E.rideTargets(s, p.node);
    let bestRide = null;
    for (const [n] of Object.entries(rides)) if (d2[n] < d2[p.node] - (p.t.freeRide ? 0.5 : 1.5) && (!bestRide || d2[n] < d2[bestRide])) bestRide = n;
    if (bestRide && (p.t.freeRide > 0 || p.t.luz >= 1)) { if (!ex(s, { t: 'ride', to: bestRide })) continue; }
    // passo a pé: vizinho com menor custo + distância
    let step = null; let stepV = Infinity;
    for (const { to } of E.neighbors(s, p.node)) {
      const c = E.moveCost(s, p, p.node, to);
      if (c.err || c.luz > p.t.luz || c.prosa > p.t.prosa) continue;
      const v = (c.luz + (c.prosa ? 0.5 : 0)) + d2[to];
      if (v < stepV && d2[to] < d2[p.node]) { stepV = v; step = to; }
    }
    if (!step) return;
    if (ex(s, { t: 'move', to: step })) return;
  }
}

// valor de compra de uma carta para este jogador agora
function cardValue(s, p, id) {
  const c = CARDS[id];
  const late = p.relics.length > 0 || s.water !== null;
  let v = 0;
  v += (c.luz || 0) * 2.2 + (c.pic || 0) * 1.3 + (c.prosa || 0) * (late ? 0.6 : 1.5) + (c.draw || 0) * 1.8;
  v += (c.gold || 0) * 1 + (c.folego || 0) * 0.8 + (c.pts || 0) * (late ? 1.2 : 0.6);
  v -= Math.max(0, c.est || 0) * 0.6;
  v += Math.max(0, -(c.est || 0)) * 0.7;
  if (c.acq?.gold) v += c.acq.gold * 0.9;
  if (c.fx === 'calm' && s.cerb) v += 2;
  if (c.fx === 'mirror' && s.medusa) v += 1.5;
  if (c.fx === 'trash') v += 2;
  if (c.fx === 'freeRide') v += 1.5;
  if (c.fx === 'darkCheap' || c.fx === 'ropeUp') v += 1;
  return v;
}

function spend(s, p) {
  const t = p.t;
  // Cérbero: acalmar ou enfrentar
  if (s.cerb && s.cerb.awake > 0) {
    while (t.calm > 0 && s.cerb.awake > 0) ex(s, { t: 'calm' });
    if (t.pic >= DLCS.cerbero.fightCost && !ex(s, { t: 'fightCerb' })) { /* ok */ }
  }
  if (s.medusa && t.pic >= DLCS.medusa.fightCost) ex(s, { t: 'fightMedusa' });
  // Bichos da Fila
  for (let g = 0; g < 6; g++) {
    let best = -1; let bv = 0;
    s.row.forEach((id, i) => {
      const c = CARDS[id];
      if (c.type !== 'beast' || c.fight > t.pic) return;
      const r = c.reward;
      const v = ((r.gold || 0) + (r.luz || 0) * 1.5 + (r.draw || 0) * 1.5 + (r.crystal || 0) * 5 + (r.trophy ? 3 : 0) + (c.onEnter ? 1 : 0)) / c.fight;
      if (v > bv) { bv = v; best = i; }
    });
    if (best < 0) break;
    ex(s, { t: 'fight', src: 'row', i: best });
  }
  while (t.pic >= 2) if (ex(s, { t: 'fight', src: 'fixed' })) break;
  // Grisu ao lado
  for (const n of [...s.grisu]) if (t.pic >= 2) ex(s, { t: 'clear', node: n });
  // Cérbero perto e com Prosa sobrando
  if (s.cerb && s.cerb.awake >= 2 && t.prosa >= DLCS.cerbero.calmCost) ex(s, { t: 'calm' });
  // compras
  for (let g = 0; g < 6; g++) {
    const opts = [];
    s.row.forEach((id, i) => { const c = CARDS[id]; if (c.cost !== undefined && !['beast', 'hazard'].includes(c.type) && c.cost <= t.prosa) opts.push({ a: { t: 'buy', src: 'row', i }, v: cardValue(s, p, id) }); });
    for (const id of FIXED) if (s.fixedQty[id] > 0 && CARDS[id].cost <= t.prosa) opts.push({ a: { t: 'buy', src: 'fixed', id }, v: cardValue(s, p, id) });
    if (!opts.length) break;
    opts.sort((a, b) => b.v - a.v);
    if (opts[0].v < BUY_MIN) break;
    if (ex(s, opts[0].a)) break;
    settle(s);
  }
}

export function botTurn(s) {
  const p = E.currentPlayer(s);
  const start = s.turnNo * 10 + s.turn;
  ex(s, { t: 'playAll' });
  settle(s);
  if (E.inMine(p)) {
    ex(s, { t: 'playAll' }); settle(s);
    if (p.t.lure > 0 && s.cerb && s.cerb.awake > 0) ex(s, { t: 'lure' });
    moveLoop(s, p);
    if (E.inMine(p) && !s.over) spend(s, p);
    if (E.inMine(p) && !s.over) moveLoop(s, p); // luz ganha nos Bichos
  }
  if (!s.over && E.currentPlayer(s) === p && s.turnNo * 10 + s.turn === start) {
    if (s.pending.length) settle(s);
    if (E.inMine(p) && !s.endStage) ex(s, { t: 'end' });
  }
  settle(s);
}

export function runBots(s, maxTurns = 2000) {
  for (let i = 0; i < maxTurns && !s.over; i++) {
    if (s.pending.length) { const pd = s.pending[0]; if (!s.players[pd.pid].bot) return; settle(s); continue; }
    if (!E.currentPlayer(s).bot) return;
    botTurn(s);
  }
}
