// MANDATO — GreedyBot (08 §8 / 09 §14). Usa o mesmo motor e os mesmos comandos de um humano.
import * as E from './engine.js';
import { LOT_OPTS, STANDARD, FAC_KEYS, GOALS, TERRAINS } from './data.js';

const { CARDS } = E;
const W = { v: 1, o: 1.2, a: 1.5 };

// ------------------------------------------------------------------ avaliação

function opScore(p, ops = []) {
  let sc = 0;
  for (const o of ops) {
    switch (o.op) {
      case 'gain': sc += o.n * W[o.r]; break;
      case 'draw': sc += o.n * 1.5; break;
      case 'appr': sc += o.n * 1.5; break;
      case 'cube': sc += o.n > 0 ? -1.6 * o.n : Math.min(-o.n, p.cubesBag) * 1.0; break;
      case 'adv': sc += o.n * 1.5; break;
      case 'advChoice': case 'advTwo': sc += 1.8; break;
      case 'explore': sc += 3; break;
      case 'choice': sc += 1.5; break;
      case 'site': sc += 3; break;
      case 'cap': sc += 2.5; break;
      case 'drawDiscard': sc += 2; break;
      case 'off': sc -= 3; break;
      case 'flag': sc += 0.6; break;
      case 'treasury': sc += o.n; break;
      default: break;
    }
  }
  return sc;
}

function vOfCalc(c) {
  const inc = c.inc;
  let v = 3 * (inc.v + W.o * inc.o + W.a * inc.a) + 0.5 * c.pop;
  v -= 0.8 * Math.max(0, c.poll) + 1.5 * Math.max(0, c.poll - 4);
  v -= 3 * Math.min(3, Math.max(0, -c.sur.e)) + 3 * Math.min(3, Math.max(0, -c.sur.w));
  v += 0.2 * Math.min(3, Math.max(0, c.sur.e)) + 0.2 * Math.min(3, Math.max(0, c.sur.w));
  return v;
}

function placementGain(s, p, card, tileIdx, variant, upg) {
  const tile = p.tiles[tileIdx];
  const old = tile.b;
  const before = vOfCalc(E.calc(s, p));
  tile.b = { id: card.id, ...(variant ? { v: variant } : {}) };
  const after = vOfCalc(E.calc(s, p));
  tile.b = old;
  let g = after - before;
  g += opScore(p, card.onBuild);
  g += (card.fac || []).length * 1.5;
  if (card.wonder) g += 16;
  if (upg) g += 0;
  return g;
}

function bestPlacement(s, p, card, src, hi) {
  let best = null;
  const variants = card.lot ? Object.keys(LOT_OPTS) : [undefined];
  for (let i = 0; i < p.tiles.length; i++) {
    for (const v of variants) {
      for (const upg of p.tiles[i].b ? [true] : [false]) {
        const r = E.checkBuild(s, p, { src, hi, tile: i, v, upg });
        if (r.err) continue;
        const g = placementGain(s, p, card, i, v, upg) - (r.desmate ? 2 : 0);
        if (!best || g > best.g) best = { g, tile: i, v, upg, r };
      }
    }
  }
  return best;
}

// Valor "teórico" de uma carta no mercado (sem exigir recursos agora)
function cardValue(s, p, id) {
  const c = CARDS[id];
  if (c.type === 'building') {
    let best = -Infinity;
    const variants = c.lot ? Object.keys(LOT_OPTS) : [undefined];
    p.tiles.forEach((t, i) => {
      if (t.b && !c.upg) return;
      if (c.onlyOn && !c.onlyOn.includes(t.k)) return;
      for (const v of variants) {
        const g = placementGain(s, p, c, i, v, !!t.b);
        if (g > best) best = g;
      }
    });
    return best === -Infinity ? -5 : best;
  }
  if (c.type === 'decree') {
    if (!DECREE_OK(p, id)) return -2;
    return 4;
  }
  if (c.type === 'intrigue') return 0.5;
  if (c.type === 'wonder') return 14;
  return opScore(p, c.fx) + (c.fac || []).length * 1.5 + (c.alert ? -1 : 0);
}
const DECREE_OK = (p, id) => (id === 'D1-01' ? p.approval <= 7 : id === 'D2-03' ? p.approval >= 7 : id === 'D3-01' ? false : id !== 'D1-02');

const costPU = (c) => (c.v || 0) + 1.5 * (c.a || 0);

// ------------------------------------------------------------------ decisões pendentes

function decide(s, pe) {
  const p = s.players[pe.pid];
  const d = pe.data;
  switch (pe.kind) {
    case 'faction': {
      const opts = FAC_KEYS.filter((f) => !d.excl.includes(f));
      const score = (f) => {
        const v = p.fac[f];
        let sc = v === 2 ? 6 : v === 4 ? 6 : v;
        if (d.mode === 'intr04') { const lead = Math.max(...s.players.filter((q) => q.id !== p.id).map((q) => q.fac[f])); sc = lead >= 3 ? lead + 2 : 0; }
        return sc;
      };
      opts.sort((a, b) => score(b) - score(a));
      return { t: 'choose', f: opts[0] };
    }
    case 'option': {
      const wantCube = p.cubesBag > 0 && d.options.some((o) => o.l.includes('🕵️'));
      return { t: 'choose', i: wantCube ? d.options.findIndex((o) => o.l.includes('🕵️')) : 0 };
    }
    case 'tile': {
      const owner = s.players[d.owner];
      const rank = (i) => { const b = owner.tiles[i].b; return b ? (E.def(b).inc || []).reduce((a, it) => a + it.n * W[it.r], 0) + (E.def(b).pop || 0) * 0.3 : 0; };
      const ts = [...d.tiles].sort((a, b) => rank(a) - rank(b));
      return { t: 'choose', tile: d.mode === 'off' && owner.id !== p.id ? ts[ts.length - 1] : ts[0] };
    }
    case 'hand': {
      const worth = (id) => { const c = CARDS[id]; return c.type === 'basic' ? (id === 'B-01' ? 1 : 2) : c.type === 'building' ? 4 : 3; };
      let bi = 0;
      p.hand.forEach((id, i) => { if (worth(id) < worth(p.hand[bi])) bi = i; });
      return { t: 'choose', hi: bi };
    }
    case 'explore': {
      const sc = d.cards.map((id) => opScore(p, E.exploreCard(id).ops) + (E.exploreCard(id).type === 'Risco' ? -1 : 0));
      return { t: 'choose', i: sc[1] > sc[0] ? 1 : 0 };
    }
    case 'reaction': return { t: 'choose', use: true };
    case 'pick': {
      let bi = 0;
      d.cards.forEach((id, i) => { if (cardValue(s, p, id) > cardValue(s, p, d.cards[bi])) bi = i; });
      return { t: 'choose', i: bi };
    }
    default: return { t: 'choose', i: 0 };
  }
}

// ------------------------------------------------------------------ turno

function playCards(s, p) {
  const cand = p.hand.map((id, hi) => ({ id, hi, c: CARDS[id] })).filter((x) => ['basic', 'standard', 'admin'].includes(x.c.type));
  const safe = cand.filter((x) => {
    const cubes = (x.c.fx || []).filter((o) => o.op === 'cube' && o.n > 0).reduce((a, o) => a + o.n, 0);
    if (!cubes) return true;
    return p.cubesBag + cubes <= 4 && p.approval >= 5;
  });
  if (!safe.length) return false;
  safe.sort((a, b) => (b.c.fx.some((o) => o.op === 'draw') ? 1 : 0) - (a.c.fx.some((o) => o.op === 'draw') ? 1 : 0));
  return !E.exec(s, { t: 'play', hi: safe[0].hi });
}

function tryGoals(s, p) {
  if (p.t.claimed || p.investRound === s.round) return false;
  const ranked = s.goals.slots.map((sl, i) => ({ sl, i })).filter((x) => !x.sl.done && (x.sl.gold == null || x.sl.silver == null))
    .filter((x) => E.goalOk(s, p, x.sl.id));
  for (const x of ranked) if (!E.exec(s, { t: 'claim', slot: x.i })) return true;
  if (!p.regionalDone && E.regionalOk(s, p) && !E.exec(s, { t: 'claim', regional: true })) return true;
  return false;
}

function tryBuild(s, p) {
  let best = null;
  p.hand.forEach((id, hi) => {
    const c = CARDS[id];
    if (c.type !== 'building') return;
    const b = bestPlacement(s, p, c, 'hand', hi);
    if (b && b.g > 0 && (!best || b.g > best.g)) best = { ...b, hi };
  });
  if (!best) return false;
  return !E.exec(s, { t: 'build', src: 'hand', hi: best.hi, tile: best.tile, v: best.v, upg: best.upg });
}

function tryWonder(s, p) {
  if (p.wondersScored >= 2) return false;
  let best = null;
  s.market.vit.forEach((id, hi) => {
    const b = bestPlacement(s, p, CARDS[id], 'wonder', hi);
    if (b && (!best || b.g > best.g)) best = { ...b, hi };
  });
  if (!best) return false;
  return !E.exec(s, { t: 'wonder', hi: best.hi, tile: best.tile, v: undefined, upg: best.upg });
}

function tryDecree(s, p) {
  const hi = p.hand.findIndex((id) => CARDS[id].type === 'decree' && DECREE_OK(p, id));
  if (hi < 0) return false;
  const slot = p.cabinet.findIndex((x) => !x);
  if (slot < 0) return false;
  return !E.exec(s, { t: 'decree', hi, slot });
}

function tryBuy(s, p) {
  const opts = [];
  STANDARD.forEach((id) => opts.push({ src: 'pile', key: id, id }));
  s.market.row.forEach((id, i) => opts.push({ src: 'row', key: i, id }));
  const left = Math.max(1, E.MAX_ROUNDS - s.round);
  const scored = [];
  for (const o of opts) {
    const cost = E.buyCost(s, p, o.id);
    if ((cost.v || 0) > p.pool.v || (cost.a || 0) > p.pool.a) continue;
    const c = CARDS[o.id];
    if (c.type === 'intrigue') continue;
    if (s.market.piles[o.id] !== undefined && s.market.piles[o.id] <= 0) continue;
    let val = cardValue(s, p, o.id);
    if (c.type === 'building') val *= Math.min(1, left / 5);
    // deck inchado piora a mão: toda carta nova tem custo de diluição
    val -= 1.2;
    const price = costPU(cost);
    scored.push({ ...o, val, ratio: val - price * 0.45, price });
  }
  scored.sort((a, b) => b.ratio - a.ratio);
  const top = scored[0];
  if (!top || top.val < 0.8) return false;
  return !E.exec(s, { t: 'buy', src: top.src, key: top.key });
}

function botTurn(s) {
  const p = s.players[s.order[s.turnIdx]];
  for (let i = 0; i < 80; i++) {
    if (s.pending.length || s.over) return;
    if (tryGoals(s, p)) continue;
    if (p.seals >= 2) { E.exec(s, { t: 'seals' }); continue; }
    if (playCards(s, p)) continue;
    if (tryDecree(s, p)) continue;
    if (tryWonder(s, p)) continue;
    if (tryBuild(s, p)) continue;
    if (tryBuy(s, p)) continue;
    break;
  }
  if (!s.pending.length && !s.over) E.exec(s, { t: 'end' });
}

// ------------------------------------------------------------------ laço automático

export function advance(state, maxSteps = 5000) {
  const s = structuredClone(state);
  runBots(s, maxSteps);
  return s;
}

// Uma ação do bot que está na vez (decisão pendente, escolha de terreno ou turno inteiro).
function botAct(s) {
  if (s.pending.length) {
    const e = E.exec(s, decide(s, s.pending[0]));
    if (e) { // decisão impossível: tenta uma opção segura para não travar
      E.exec(s, { t: 'choose', i: 0, f: 'tec', tile: s.pending[0].data.tiles ? s.pending[0].data.tiles[0] : 0, hi: 0, use: false });
    }
  } else if (s.phase === 'draft') {
    const pool = s.draft.pool;
    E.exec(s, { t: 'pick', terrain: pool[Math.floor(Math.random() * pool.length)] });
  } else botTurn(s);
}

export function runBots(s, maxSteps = 5000) {
  for (let n = 0; n < maxSteps && !s.over; n++) {
    const who = E.actor(s);
    if (who == null || !s.players[who].bot) return s;
    botAct(s);
  }
  return s;
}

// A vez de UM bot (até o jogo passar para outro jogador). A UI usa isto para os bots jogarem um de cada vez, à vista da mesa.
export function botStep(state) {
  const s = structuredClone(state);
  const who = E.actor(s);
  if (who == null || !s.players[who].bot) return { state: s, who: null, lines: [] };
  const last = s.log[s.log.length - 1];
  for (let n = 0; n < 400 && !s.over && E.actor(s) === who; n++) botAct(s);
  const from = last ? s.log.lastIndexOf(last) + 1 : 0;
  return { state: s, who, lines: s.log.slice(from).filter((l) => l.pid === who && l.kind !== 'round') };
}

// Comando do humano + resposta automática dos bots.
export function step(state, cmd) {
  const r = E.apply(state, cmd);
  if (r.error) return r;
  runBots(r.state);
  return r;
}

export { GOALS, TERRAINS };
