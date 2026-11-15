// MANDATO — motor de regras. Puro (sem React/DOM): roda no navegador e no Node (simulação).
// Fonte das regras: MANDATO/02…10. Todo sorteio usa PRNG com semente guardada no estado.
import {
  CARDS, STARTER, STANDARD, STD_QTY, LOT_OPTS, SPECIAL_TIERS, WONDERS, GOALS, ROUNDS, TERRAINS, TERRAIN_IDS,
  EXPLORE, SETUP, packageFor, FAC_KEYS, WATER_KINDS, RIVAL, rivalGain, PLAYER_COLORS,
} from './data.js';

export const HAND = 5;
// Pilha de Loteamento: 8 por jogador + 4 (antes acabava na rodada 2–3; agora dura até ~rodada 5–7).
export const loteamentoQty = (n) => 8 * n + 4;
export const ROUND1_REVERSE = globalThis.process?.env?.R1REV !== '0'; // rodada 1 em ordem inversa (regra do 08); R1REV=0 só para testes
export const MAX_ROUNDS = 12;
const EX_BY_ID = Object.fromEntries(Object.values(EXPLORE).flat().map((c) => [c.id, c]));
export const exploreCard = (id) => EX_BY_ID[id];
const ZONE_ORDER = ['RES', 'COM', 'IND', 'INF', 'VER', 'SER'];

// ------------------------------------------------------------------ RNG, log

function rnd(s) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function shuffle(s, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function log(s, msg, kind = '', pid = null) {
  s.log.push({ r: s.round, msg, kind, pid });
  if (s.log.length > (s.logCap || 300)) s.log.splice(0, s.log.length - (s.logCap || 300));
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (s, id) => s.players[id];
const nm = (p) => p.name;

// ------------------------------------------------------------------ cartas na grade

export function def(b) {
  const c = CARDS[b.id];
  if (!c.lot) return c;
  const o = LOT_OPTS[b.v];
  return { ...c, ...o, zones: [o.zone], name: `Loteamento (${o.label})` };
}
const isOff = (s, b) => !!b.off && (b.off.k === 'turn' || s.round <= b.off.r);
export const hasDecree = (p, id) => p.cabinet.includes(id);
const apprMax = (p) => Math.min(10, hasDecree(p, 'D1-01') ? 7 : 10, hasDecree(p, 'D3-01') ? 6 : 10);

function makeTiles(terrainId) {
  const T = TERRAINS[terrainId];
  const tiles = [];
  if (T.island) T.tiles.forEach((t, i) => tiles.push({ id: i, k: t.k, isl: t.isl, x: t.x, y: t.y, cleared: false, b: null }));
  else T.grid.forEach((k, i) => tiles.push({ id: i, k: k === 'P' || k === 'H' ? '.' : k, isl: 'M', x: i % 4, y: Math.floor(i / 4), cleared: false, b: null }));
  tiles.forEach((t, i) => {
    t.adj = tiles.map((_, j) => j).filter((j) => j !== i && tiles[j].isl === t.isl && Math.abs(tiles[j].x - t.x) + Math.abs(tiles[j].y - t.y) === 1);
  });
  const pi = T.island ? 4 : T.grid.indexOf('P');
  const hi = T.island ? 5 : T.grid.indexOf('H');
  tiles[pi].b = { id: 'PREF' };
  tiles[hi].b = { id: 'HOME' };
  return tiles;
}

// ------------------------------------------------------------------ derivados

function pairsOf(set, byI, tiles) {
  // Lei de Zoneamento: pares adjacentes da mesma Zona (RES/COM/IND), máx. 3 pares no total
  let left = 3;
  const out = { RES: 0, COM: 0, IND: 0 };
  for (const z of ['RES', 'COM', 'IND']) {
    let n = 0;
    set.forEach((i) => {
      if (!byI[i].c.zones.includes(z)) return;
      tiles[i].adj.forEach((j) => { if (j > i && set.has(j) && byI[j].c.zones.includes(z)) n++; });
    });
    out[z] = Math.min(n, left);
    left -= out[z];
  }
  return out;
}

export function calc(s, p) {
  const T = TERRAINS[p.terrain];
  const tiles = p.tiles;
  const m = s.mods || {};
  const bl = [];
  tiles.forEach((t, i) => { if (t.b) bl.push({ i, b: t.b, c: def(t.b) }); });
  const alive = bl.filter((x) => !isOff(s, x.b));
  const byI = {};
  alive.forEach((x) => { byI[x.i] = x; });
  const act = new Set();
  const zoning = () => (hasDecree(p, 'D2-02') ? pairsOf(act, byI, tiles) : { RES: 0, COM: 0, IND: 0 });
  const popOf = () => {
    let pop = 0;
    act.forEach((i) => {
      const x = byI[i];
      pop += (x.c.pop || 0) + (x.b.popBonus || 0);
      const pa = x.c.popAdj;
      if (pa) {
        let n = 0;
        tiles[i].adj.forEach((j) => { if (act.has(j) && byI[j].c.zones.includes(pa.zone)) n += pa.n; });
        pop += Math.min(n, pa.max);
      }
    });
    return pop + zoning().RES;
  };
  const metro = () => [...act].some((i) => byI[i].c.reqMinus);
  const effReq = (x, mt) => {
    let r = x.c.req || 0;
    if (mt && r && x.c.zones.some((z) => z === 'COM' || z === 'IND')) r = Math.max(0, r - 2);
    return r;
  };
  alive.forEach((x) => { if (!effReq(x, false)) act.add(x.i); });
  for (let guard = 0; guard < 20; guard++) {
    const pop = popOf();
    const mt = metro();
    let changed = false;
    alive.forEach((x) => {
      if (!act.has(x.i) && pop >= effReq(x, mt)) { act.add(x.i); changed = true; }
    });
    if (!changed) break;
  }
  const pop = popOf();

  let poll = 0;
  const cap = { e: T.cap.e + p.caps.e, w: T.cap.w + p.caps.w };
  const cons = { e: 0, w: 0 };
  const inc = { v: 0, o: 0, a: 0 };
  const forestIntact = tiles.filter((t) => t.k === 'F' && !t.cleared).length;
  let hubBonus = 0;
  const infPower = { e: 0, w: 0 };
  act.forEach((i) => {
    const { c, b } = byI[i];
    const tile = tiles[i];
    let pw = c.power ? { ...c.power } : null;
    let pl = c.poll || 0;
    const solar = c.solar || (p.terrain === 'deserto' && b.v === 'INFe');
    if (p.terrain === 'deserto' && solar) { if (pw && pw.e) pw.e += 1; if (b.v === 'INFe') { pw = { e: 3 }; pl = 0; } else pl = 0; }
    if (p.terrain === 'litoral' && c.zones.includes('VER') && tile.k === 'O') pl -= 1;
    poll += pl;
    if (pw) { cap.e += pw.e || 0; cap.w += pw.w || 0; if (c.zones.includes('INF') && !c.hub) { infPower.e += pw.e ? 1 : 0; infPower.w += pw.w ? 1 : 0; } }
    if (c.hub) hubBonus = c.hub;
    if (c.cons) { cons.e += c.cons.e || 0; cons.w += c.cons.w || 0; }
    (c.inc || []).forEach((it) => {
      let n = it.n;
      const adjAct = tile.adj.filter((j) => act.has(j));
      if (it.adj) n = Math.min(it.n * adjAct.filter((j) => byI[j].c.zones.includes(it.adj)).length, it.max);
      else if (it.adjAny) n = adjAct.some((j) => byI[j].c.zones.includes(it.adjAny)) ? it.n : 0;
      else if (it.onKind) n = tile.k === it.onKind ? it.n : 0;
      else if (it.minorIsland) n = tile.isl !== 'M' ? it.n : 0;
      inc[it.r] += n;
    });
    if (p.terrain === 'litoral' && (c.zones.includes('COM') || c.zones.includes('VER')) && tile.k === 'O') inc.v += 1;
    if (p.terrain === 'planicie' && c.zones.includes('RES') && tile.adj.some((j) => tiles[j].b && def(tiles[j].b).zones.includes('VER'))) inc.v += 1; // bairro-jardim
    if (p.terrain === 'floresta' && (c.zones.includes('VER') || c.zones.includes('COM')) && tile.adj.some((j) => tiles[j].k === 'F' && !tiles[j].cleared)) inc.v += 1;
    if (m.fair && c.zones.includes('COM')) inc.v += (p.terrain === 'litoral' && tile.k === 'O') || (p.terrain === 'ilha') ? 2 : 1;
  });
  if (hubBonus) {
    const be = Math.min(hubBonus, infPower.e);
    cap.e += be;
    cap.w += Math.min(hubBonus - be, infPower.w);
  }
  if (p.terrain === 'floresta') poll -= Math.min(3, Math.floor(forestIntact / 2));
  if (s.tokens.ver === p.id) poll -= 1;
  if (s.tokens.tec === p.id) { cap.e += 2; cap.w += 2; }
  if (m.energy && p.terrain !== 'deserto') cap.e -= 2;
  if (m.heat && (p.terrain === 'deserto' || p.terrain === 'planicie')) cap.w -= 3;
  if (m.rain && p.terrain === 'deserto') cap.w += 2;

  if (hasDecree(p, 'D1-01')) inc.v += 2;
  if (hasDecree(p, 'D2-03')) inc.v += Math.min(3, Math.floor(pop / 5));
  if (hasDecree(p, 'D2-02')) { const z = zoning(); inc.v += z.COM; inc.o += z.IND; }
  if (s.tokens.emp === p.id) inc.v += 1;
  if (s.tokens.sin === p.id) inc.o += 1;
  if (poll >= 9) inc.v = Math.max(0, inc.v - 1);

  const zn = {};
  ZONE_ORDER.concat('MON').forEach((z) => { zn[z] = bl.filter((x) => x.c.zones.includes(z)).length; });
  return {
    pop, poll, cap, cons, sur: { e: cap.e - cons.e, w: cap.w - cons.w }, inc, act, built: bl.length, zn,
    bigLib: [...act].some((i) => byI[i].c.bigLib), recycle: [...act].some((i) => byI[i].c.recycle),
    shield: [...act].filter((i) => byI[i].c.shield).length, wonderDisc: [...act].some((i) => byI[i].c.wonderDiscount),
    off: bl.filter((x) => isOff(s, x.b)).map((x) => x.i),
  };
}

export const tmax = (s, p) => 3 + (s.tokens.emp === p.id ? 2 : 0) + (p.t.treasuryBonus || 0);

// ------------------------------------------------------------------ recursos / aprovação / mérito / facções

function addAppr(s, p, n, why) {
  const before = p.approval;
  p.approval = clamp(p.approval + n, 0, apprMax(p));
  if (p.approval !== before && why) log(s, `${nm(p)} ${n > 0 ? 'ganha' : 'perde'} ${Math.abs(p.approval - before)} 😊 (${why}).`, 'appr', p.id);
  if (p.approval <= 0) crisis(s, p);
}
function crisis(s, p) {
  if (p.crisisRound === s.round) return;
  p.crisisRound = s.round;
  p.approval = 3;
  p.crises += 1;
  s.stats.crises += 1;
  log(s, `🔥 Crise de Governo! ${nm(p)} perde ⭐1 e a Aprovação volta a 3.`, 'bad', p.id);
  addMerit(s, p, -1, 'crise');
  if (s.solo && p.crises >= 2) finish(s, 'Derrota: duas Crises de Governo.', []);
}
function addMerit(s, p, n, src) {
  const before = p.merit;
  p.merit = Math.max(0, p.merit + n);
  const d = p.merit - before;
  if (!d) return;
  if (d > 0) s.stats.src[src] = (s.stats.src[src] || 0) + d;
  log(s, `⭐ ${nm(p)} ${d > 0 ? 'ganha' : 'perde'} ${Math.abs(d)} ⭐ (${src}) → ${p.merit}.`, d > 0 ? 'merit' : 'bad', p.id);
  if (p.merit >= s.target && !s.finalRound) { s.finalRound = true; log(s, `🏁 ${nm(p)} chegou a ⭐${s.target}! A rodada será completada.`, 'merit'); }
}
export function advFac(s, p, f, n) {
  const before = p.fac[f];
  p.fac[f] = clamp(before + n, 0, 6);
  if (p.fac[f] === before) return;
  if (n > 0 && p.fac[f] >= 3 && !p.facMark[f]) { p.facMark[f] = true; addMerit(s, p, 1, 'Facção (marco 3)'); }
  updateTokens(s);
}
function updateTokens(s) {
  for (const f of FAC_KEYS) {
    const vals = s.players.map((q) => q.fac[f]);
    const top = Math.max(...vals);
    const holders = s.players.filter((q) => q.fac[f] === top);
    const uniqueTop = top >= 5 && holders.length === 1 ? holders[0] : null;
    const cur = s.tokens[f];
    if (cur !== null) {
      const h = s.players[cur];
      const overtaken = s.players.some((q) => q.fac[f] > h.fac[f]);
      if (h.fac[f] >= 5 && !overtaken) continue;
      if (uniqueTop && uniqueTop.id !== cur) {
        s.tokens[f] = uniqueTop.id;
        addMerit(s, h, -1, `Aliança perdida`);
        addMerit(s, uniqueTop, 1, `Aliança ${f}`);
        log(s, `🏅 ${nm(uniqueTop)} toma a Aliança dos ${f === 'tec' ? 'Tecnocratas' : f === 'ver' ? 'Verdes' : f === 'emp' ? 'Empresários' : 'Sindicatos'}.`, 'merit');
      } else if (!uniqueTop) {
        s.tokens[f] = null;
        addMerit(s, h, -1, 'Aliança perdida');
      }
    } else if (uniqueTop) {
      s.tokens[f] = uniqueTop.id;
      addMerit(s, uniqueTop, 1, `Aliança ${f}`);
      log(s, `🏅 ${nm(uniqueTop)} conquista a Aliança dos ${f === 'tec' ? 'Tecnocratas' : f === 'ver' ? 'Verdes' : f === 'emp' ? 'Empresários' : 'Sindicatos'}.`, 'merit');
    }
  }
}
function addCubes(s, p, n) {
  if (n >= 0) {
    const k = Math.min(n, p.cubesSupply);
    p.cubesSupply -= k;
    p.cubesBag += k;
    if (k) log(s, `🕵️ ${nm(p)} coloca ${k} cubo(s) no Saco.`, 'cube', p.id);
  } else {
    const k = Math.min(-n, p.cubesBag);
    p.cubesBag -= k;
    p.cubesSupply += k;
    if (k) log(s, `🕵️ ${nm(p)} remove ${k} cubo(s) do Saco.`, '', p.id);
  }
}
const draw = (s, p, n) => {
  for (let i = 0; i < n; i++) {
    if (!p.deck.length) {
      if (!p.discard.length) return;
      p.deck = shuffle(s, p.discard);
      p.discard = [];
    }
    p.hand.push(p.deck.pop());
  }
};
export const tension = (r) => (r >= 10 ? 6 : r >= 7 ? 5 : r >= 4 ? 4 : 3);

// ------------------------------------------------------------------ Fiscalização

export function fisc(s, why, bonus = 0) {
  s.stats.fisc += 1;
  const k = tension(s.round) + bonus;
  log(s, `🔔 Fiscalização! (${why}) — sorteando ${k} cubo(s) do Saco.`, 'fisc');
  const bag = [];
  for (let i = 0; i < s.bag.neutral; i++) bag.push(-1);
  s.players.forEach((p) => { for (let i = 0; i < p.cubesBag; i++) bag.push(p.id); });
  const drawn = shuffle(s, bag).slice(0, Math.min(k, bag.length));
  const hits = {};
  drawn.forEach((id) => { if (id >= 0) hits[id] = (hits[id] || 0) + 1; });
  // registro público do último sorteio (a mesa mostra os cubos saindo)
  s.lastFisc = { id: s.stats.fisc, round: s.round, why, k, total: bag.length, drawn: drawn.slice(), res: {} };
  s.players.forEach((p) => {
    const h = hits[p.id] || 0;
    if (!h) { p.fiscStreak += 1; return; }
    p.fiscStreak = 0;
    p.cubesBag -= h;
    p.cubesSupply += h;
    let loss = h;
    if (s.tokens.sin === p.id) loss -= 1;
    const sh = calc(s, p).shield;
    if (sh) loss -= 1;
    loss = Math.max(0, loss);
    log(s, `🕵️ ${nm(p)} tem ${h} cubo(s) sorteado(s) — perde ${loss} 😊.`, 'bad', p.id);
    if (loss) addAppr(s, p, -loss, 'Fiscalização');
    s.lastFisc.res[p.id] = { h, loss, invest: h >= 3 };
    if (h >= 3) {
      s.stats.invest += 1;
      p.investRound = s.round;
      log(s, `⚖️ Investigação contra ${nm(p)}: −⭐1 e sem Metas nesta rodada.`, 'bad', p.id);
      addMerit(s, p, -1, 'Investigação');
    }
    if (p.terrain === 'litoral' && p.tideRound !== s.round) {
      const cand = p.tiles.map((t, i) => ({ t, i })).filter((x) => x.t.k === 'O' && x.t.b && x.t.b.id !== 'PREF' && !isOff(s, x.t.b));
      if (cand.length) {
        cand.sort((a, b) => incPU(def(b.t.b)) - incPU(def(a.t.b)));
        cand[0].t.b.off = { k: 'turn' };
        p.tideRound = s.round;
        log(s, `🌊 Maré Alta: ${def(cand[0].t.b).name} de ${nm(p)} fica inativo até o próximo turno.`, 'bad', p.id);
      }
    }
    // Mina de Cobre inativa quando um cubo seu é sorteado
    p.tiles.forEach((t) => { if (t.b && def(t.b).mine && !isOff(s, t.b)) t.b.off = { k: 'turn' }; });
  });
}
const incPU = (c) => (c.inc || []).reduce((a, it) => a + it.n * (it.r === 'v' ? 1 : it.r === 'o' ? 1.2 : 1.5), 0);

// ------------------------------------------------------------------ ops (efeitos)

const WAIT = Symbol('wait');

function ask(s, p, kind, data, extra) {
  s.pending.push({ pid: p.id, kind, data, ...extra });
  return WAIT;
}

function runOps(s, p, ops, ctx = {}) {
  for (let i = 0; i < ops.length; i++) {
    const r = doOp(s, p, ops[i], ctx);
    if (r === WAIT) {
      const pe = s.pending[s.pending.length - 1];
      pe.rest = ops.slice(i + 1);
      pe.ctx = ctx;
      return;
    }
  }
}

function ownBuildingTiles(s, p, kind) {
  return p.tiles.map((t, i) => ({ t, i })).filter((x) => x.t.b && x.t.b.id !== 'PREF' && !isOff(s, x.t.b)
    && (kind === 'any' || x.t.k === kind || (kind === 'O' && x.t.k === 'C'))).map((x) => x.i);
}

function doOp(s, p, op, ctx) {
  switch (op.op) {
    case 'gain': p.pool[op.r] += op.n; return null;
    case 'draw': draw(s, p, op.n); return null;
    case 'appr':
      if (op.ifAdj) { const adj = ctx.tile != null && p.tiles[ctx.tile].adj.some((j) => p.tiles[j].b && def(p.tiles[j].b).zones.includes(op.ifAdj)); if (!adj) return null; }
      if (op.ifTile === 'comOrla') { if (!p.tiles.some((t) => t.b && t.k === 'O' && def(t.b).zones.includes('COM'))) return null; }
      addAppr(s, p, op.n, ctx.src || 'efeito');
      return null;
    case 'cube': addCubes(s, p, op.n); return null;
    case 'adv': advFac(s, p, op.f, op.n); return null;
    case 'advChoice': return ask(s, p, 'faction', { n: op.n, mode: 'adv', excl: [] });
    case 'advTwo': return ask(s, p, 'faction', { n: 1, mode: 'advTwoA', excl: [] });
    case 'merit': addMerit(s, p, op.n, ctx.src || 'carta'); return null;
    case 'treasury': p.treasury += op.n; return null;
    case 'cap': p.caps[op.res] += op.n; log(s, `${nm(p)} ganha +${op.n} ${op.res === 'e' ? '⚡' : '💧'} de capacidade permanente.`, '', p.id); return null;
    case 'flag': p.t[op.k] = op.v; return null;
    case 'next': p.next[op.k] = (p.next[op.k] || 0) + op.v; return null;
    case 'site': p.discard.push(op.id); log(s, `${nm(p)} recebe ${CARDS[op.id].name} no descarte.`, '', p.id); return null;
    case 'choice': return ask(s, p, 'option', { options: op.options, src: ctx.src });
    case 'drawDiscard': draw(s, p, op.draw); return p.hand.length ? ask(s, p, 'hand', { mode: 'discard', n: op.discard }) : null;
    case 'explore': return doExplore(s, p);
    case 'desmate': {
      const tiles = p.tiles.map((t, i) => ({ t, i })).filter((x) => x.t.k === 'F' && !x.t.cleared).map((x) => x.i);
      if (!tiles.length) return null;
      return ask(s, p, 'tile', { mode: 'desmate', tiles, owner: p.id, forced: !!op.forced });
    }
    case 'off': {
      const tiles = ownBuildingTiles(s, p, op.kind);
      if (!tiles.length) return null;
      return ask(s, p, 'tile', { mode: 'off', tiles, owner: p.id, until: op.until });
    }
    default: return null;
  }
}

function doExplore(s, p) {
  const ex = p.ex;
  if (ex.deck.length < 2 && ex.disc.length) {
    ex.deck = ex.deck.concat(shuffle(s, ex.disc));
    ex.disc = [];
  }
  const cards = ex.deck.splice(0, Math.min(2, ex.deck.length));
  if (!cards.length) { log(s, `${nm(p)} não tem mais cartas de Exploração.`, '', p.id); return null; }
  if (cards.length === 1) { resolveExplore(s, p, cards, 0); return null; }
  return ask(s, p, 'explore', { cards });
}

function resolveExplore(s, p, cards, i) {
  const chosen = cards[i];
  const other = cards.filter((_, k) => k !== i);
  p.ex.deck.push(...other);
  const c = EX_BY_ID[chosen];
  p.explored += 1;
  log(s, `🧭 ${nm(p)} explora: ${c.name} (${c.type}).`, '', p.id);
  if (c.type !== 'Sítio') p.ex.disc.push(chosen);
  runOps(s, p, c.ops, { src: c.name });
}

// ------------------------------------------------------------------ pendências

export function pendingFor(s) { return s.pending[0] || null; }

function resolvePending(s, choice) {
  const pe = s.pending[0];
  if (!pe) return 'Nada a decidir.';
  const p = P(s, pe.pid);
  const err = applyChoice(s, p, pe, choice);
  if (err) return err;
  s.pending.shift();
  if (pe.rest && pe.rest.length) runOps(s, p, pe.rest, pe.ctx || {});
  return null;
}

function applyChoice(s, p, pe, ch) {
  const d = pe.data;
  switch (pe.kind) {
    case 'faction': {
      if (!FAC_KEYS.includes(ch.f)) return 'Escolha uma Facção.';
      if (d.excl.includes(ch.f)) return 'Escolha uma Facção diferente.';
      if (d.mode === 'adv') advFac(s, p, ch.f, d.n);
      else if (d.mode === 'advTwoA') { advFac(s, p, ch.f, 1); s.pending.splice(1, 0, { pid: p.id, kind: 'faction', data: { n: 1, mode: 'adv', excl: [ch.f] }, rest: [], ctx: {} }); }
      else if (d.mode === 'intr04') {
        const others = s.players.filter((q) => q.id !== p.id).sort((a, b) => b.fac[ch.f] - a.fac[ch.f]);
        const lead = others[0];
        if (lead && lead.fac[ch.f] > 0) { advFac(s, lead, ch.f, -2); log(s, `${nm(lead)} recua 2 em ${FAC_ICON[ch.f]}.`, '', lead.id); }
        advFac(s, p, ch.f, 1);
      } else if (d.mode === 'alliance') {
        advFac(s, p, ch.f, 1);
        if (d.target != null) s.pending.splice(1, 0, { pid: d.target, kind: 'faction', data: { n: 1, mode: 'adv', excl: [ch.f] }, rest: [], ctx: {} });
      }
      return null;
    }
    case 'option': {
      const o = d.options[ch.i];
      if (!o) return 'Opção inválida.';
      runOps(s, p, o.ops, { src: d.src });
      return null;
    }
    case 'tile': {
      if (!d.tiles.includes(ch.tile)) return 'Casa inválida.';
      const owner = P(s, d.owner);
      const t = owner.tiles[ch.tile];
      if (d.mode === 'desmate') { t.cleared = true; log(s, `🌲 ${nm(p)} desmata uma casa de Floresta.`, '', p.id); }
      else if (d.mode === 'off') {
        t.b.off = d.until === 'turn' ? { k: 'turn' } : d.until === 'next' ? { k: 'round', r: s.round + 1 } : { k: 'round', r: s.round };
        log(s, `⛔ ${def(t.b).name} de ${nm(owner)} fica inativo.`, 'bad', owner.id);
      }
      return null;
    }
    case 'hand': {
      const id = p.hand[ch.hi];
      if (id == null) return 'Escolha uma carta da mão.';
      p.hand.splice(ch.hi, 1);
      if (d.mode === 'exile') p.exiled.push(id); else p.discard.push(id);
      return null;
    }
    case 'explore': {
      if (ch.i !== 0 && ch.i !== 1) return 'Escolha uma carta.';
      resolveExplore(s, p, d.cards, ch.i);
      return null;
    }
    case 'pick': {
      const id = d.cards[ch.i];
      if (!id) return 'Escolha uma carta.';
      p.discard.push(id);
      log(s, `${nm(p)} escolhe ${CARDS[id].name} (Pacote de Posição).`, '', p.id);
      return null;
    }
    case 'reaction': {
      const tgt = p;
      if (ch.use) {
        const hi = tgt.hand.indexOf('I2-03');
        if (hi >= 0) { tgt.hand.splice(hi, 1); tgt.exiled.push('I2-03'); }
        draw(s, tgt, 1);
        log(s, `🛡️ ${nm(tgt)} usa Contra-Inteligência e cancela ${CARDS[d.card].name}.`, 'fisc', tgt.id);
      } else applyIntrigue(s, P(s, d.from), tgt, d.card);
      return null;
    }
    default: return 'Decisão desconhecida.';
  }
}
const FAC_ICON = { tec: '🔧', ver: '🌿', emp: '💼', sin: '✊' };

// ------------------------------------------------------------------ Metas

export function goalOk(s, p, gid) {
  const c = calc(s, p);
  const f = p.fac;
  switch (gid) {
    case 'G-01': return c.zn.COM >= 3 && c.inc.v >= 5;
    case 'G-02': return c.zn.IND >= 3 && c.inc.o >= 6;
    case 'G-03': return p.t.startTreasury >= tmax(s, { ...p, t: { ...p.t, treasuryBonus: 0 } });
    case 'G-04': return c.pop >= 18;
    case 'G-05': return p.tiles.some((t) => {
      const at = (dx, dy) => p.tiles.find((u) => u.isl === t.isl && u.x === t.x + dx && u.y === t.y + dy);
      return [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => { const u = at(dx, dy); return u && u.b && def(u.b).zones.includes('RES'); });
    });
    case 'G-06': return c.zn.VER >= 3 && c.poll <= 0;
    case 'G-07': return c.sur.e >= 3 && c.sur.w >= 3;
    case 'G-08': return c.poll <= 2 && c.pop >= 12;
    case 'G-09': return p.approval === 10;
    case 'G-10': return ['RES', 'COM', 'IND', 'INF', 'VER', 'SER'].every((z) => c.zn[z] >= 1);
    case 'G-11': return p.cubesBag === 0 && c.built >= 8;
    case 'G-12': return FAC_KEYS.every((k) => f[k] >= 2);
    case 'G-13': {
      if (s.players.length === 1) return FAC_KEYS.filter((k) => f[k] >= 3).length >= 2;
      return FAC_KEYS.filter((k) => s.players.every((q) => q.id === p.id || q.fac[k] < f[k])).length >= 2;
    }
    case 'G-14': return p.cabinet.every(Boolean);
    case 'G-15': return p.t.builtCount >= 3;
    case 'G-16': return c.built >= 12;
    case 'G-17': return p.explored >= 6;
    case 'G-18': return p.fiscStreak >= 3;
    default: return false;
  }
}

export function regionalOk(s, p) {
  const c = calc(s, p);
  const T = TERRAINS[p.terrain];
  const tiles = p.tiles;
  const zOn = (t, z) => t.b && def(t.b).zones.includes(z);
  switch (T.regionalGoal.id) {
    case 'RG-LIT': return tiles.filter((t) => t.k === 'O' && (zOn(t, 'COM') || zOn(t, 'VER'))).length >= 3 && p.approval >= 7;
    case 'RG-MON': return tiles.filter((t) => t.k === 'J' && zOn(t, 'IND') && !isOff(s, t.b) && c.act.has(t.id)).length >= 2 && c.poll <= 4;
    case 'RG-PLA': return c.pop >= 12 && p.approval >= 7 && c.poll <= 3;
    case 'RG-DES': return tiles.some((t) => t.b && t.b.id === 'R-DES-1') && c.sur.e >= 4 && c.sur.w >= 4;
    case 'RG-FLO': return tiles.filter((t) => t.k === 'F' && !t.cleared).length >= 4 && c.pop >= 10;
    case 'RG-ILH': return p.links.includes('N') && p.links.includes('L') && c.inc.v >= 6;
    default: return false;
  }
}

function claimCheck(s, p) {
  if (p.t.claimed) return 'Você já reivindicou uma Meta neste turno.';
  if (p.investRound === s.round) return 'Sob Investigação: sem Metas nesta rodada.';
  return null;
}

function doClaim(s, p, cmd) {
  const e = claimCheck(s, p);
  if (e) return e;
  if (cmd.regional) {
    if (p.regionalDone) return 'Meta Regional já cumprida.';
    if (!regionalOk(s, p)) return 'Requisitos da Meta Regional não cumpridos.';
    p.regionalDone = true;
    p.t.claimed = true;
    log(s, `📜 ${nm(p)} cumpre a Meta Regional "${TERRAINS[p.terrain].regionalGoal.name}" (⭐2).`, 'merit', p.id);
    addMerit(s, p, 2, 'Meta Regional');
    return null;
  }
  const slot = s.goals.slots[cmd.slot];
  if (!slot) return 'Meta inexistente.';
  if (!goalOk(s, p, slot.id)) return 'Requisitos não cumpridos agora.';
  const g = GOALS.find((x) => x.id === slot.id);
  let tier;
  if (slot.gold == null && slot.silver !== p.id) tier = 'gold';
  else if (slot.silver == null && slot.gold !== p.id) tier = 'silver';
  else return 'Não há vaga disponível para você nesta Meta.';
  slot[tier] = p.id;
  p.t.claimed = true;
  log(s, `📜 ${nm(p)} reivindica ${g.name} (${tier === 'gold' ? 'Ouro ⭐2' : 'Prata ⭐1'}).`, 'merit', p.id);
  addMerit(s, p, tier === 'gold' ? 2 : 1, `Meta ${tier === 'gold' ? 'Ouro' : 'Prata'}`);
  refillGoals(s);
  return null;
}
function refillGoals(s) {
  s.goals.slots.forEach((sl, i) => {
    if (sl.gold != null && sl.silver != null) {
      if (s.goals.deck.length) s.goals.slots[i] = { id: s.goals.deck.shift(), gold: null, silver: null };
      else s.goals.slots[i] = { ...sl, done: true };
    }
  });
}

// ------------------------------------------------------------------ construção

const WATER = (k) => WATER_KINDS.includes(k);

export function obraCost(s, p, card, tile, { upgrade = false } = {}) {
  let c = card.obra;
  let floor = 1;
  const k = tile.k;
  if (k === 'E' && !card.hydro) c += 1;
  if (k === 'D') c += 1;
  if (k === 'F' && !tile.cleared && !card.forestOk) c += 1;
  if (p.terrain === 'ilha' && card.id === 'E2-09') c -= 1;
  if (p.terrain === 'montanha' && card.hydro && (k === 'R' || k === 'E')) c -= 1;
  if (p.terrain === 'planicie' && card.lot) c -= 1; // Terra Barata: lote pronto mais rápido
  if (upgrade) c -= 1;
  if (hasDecree(p, 'D1-02') && card.zones.includes('IND')) c += 1;
  if (s.tokens.tec === p.id && card.zones.includes('INF')) c -= 1;
  if (s.tokens.ver === p.id && card.zones.includes('VER')) c -= 1;
  if (card.wonder && calc(s, p).wonderDisc) c -= 1;
  if (!p.t.firstBuildUsed) {
    if (hasDecree(p, 'D2-01')) { c -= 1; floor = 0; }
    if (p.t.firstBuildDisc) { c -= p.t.firstBuildDisc; floor = 0; }
  }
  if (p.t.encostaDisc && k === 'E') { c -= p.t.encostaDisc; floor = 0; }
  return Math.max(floor, c);
}

// Valida uma construção; devolve { err } ou { card, ob, aq, desmate, upgrade }
export function checkBuild(s, p, o) {
  let id;
  let aq = {};
  if (o.src === 'row') {
    if (!p.t.express) return { err: 'Precisa jogar o Ministro de Obras (Obra Expressa).' };
    id = s.market.row[o.hi];
  } else if (o.src === 'wonder') id = s.market.vit[o.hi];
  else id = p.hand[o.hi];
  const card = id && CARDS[id];
  if (!card || (card.type !== 'building' && card.type !== 'wonder')) return { err: 'Esta carta não é uma Edificação.' };
  const tile = p.tiles[o.tile];
  if (!tile) return { err: 'Escolha uma casa.' };
  let eff = card;
  if (card.lot) {
    if (!LOT_OPTS[o.v]) return { err: 'Escolha a Zona do Loteamento.' };
    eff = { ...card, ...LOT_OPTS[o.v], zones: [LOT_OPTS[o.v].zone] };
  }
  let upgrade = false;
  if (tile.b) {
    if (!o.upg) return { err: 'Casa ocupada.' };
    if (tile.b.id === 'PREF') return { err: 'A Prefeitura não pode ser substituída.' };
    const old = def(tile.b);
    if (!card.upg || !old.zones.includes(card.upg)) return { err: 'Só uma Melhoria da mesma Zona pode ir sobre um edifício.' };
    upgrade = true;
  } else if (o.upg) return { err: 'Não há edifício para melhorar.' };
  if (eff.onlyOn && !eff.onlyOn.includes(tile.k) && !(eff.onlyOn.includes('O') && tile.k === 'C')) return { err: `Só pode ser construído em ${eff.onlyOn.join('/')}.` };
  if (eff.needWater && !WATER(tile.k)) return { err: 'Exige casa de ÁGUA (Orla, Rio, Oásis ou Costa).' };
  if (eff.tileAny && !(WATER(tile.k) || tile.k === 'E')) return { err: 'Exige casa de ÁGUA ou Encosta.' };
  let desmate = false;
  // Ecovila: na Floresta, o Loteamento (qualquer Zona) entra no meio das árvores sem desmatar
  const eco = p.terrain === 'floresta' && card.lot;
  if (tile.k === 'F' && !tile.cleared && !eff.forestOk && !eco) desmate = true;
  const c = calc(s, p);
  if (eff.buildReq) {
    if (eff.buildReq.pop && c.pop < eff.buildReq.pop) return { err: `Exige 👥 ≥ ${eff.buildReq.pop}.` };
    if (eff.buildReq.ver && c.zn.VER < eff.buildReq.ver) return { err: 'Exige ≥ 3 VER construídos.' };
  }
  if (eff.ferry && p.terrain !== 'ilha') return { err: 'Só na Ilha.' };
  if (eff.ferry && tile.isl === 'M') return { err: 'A Balsa só pode ser construída numa ilha menor (Norte ou Leste).' };
  if (eff.ferry && p.links.includes(tile.isl)) return { err: 'Esta ilha já está ligada por uma Balsa.' };
  if (card.wonder) aq = { v: card.cost.v, a: card.cost.a };
  else if (o.src === 'row') aq = card.cost;
  const ob = obraCost(s, p, eco ? { ...eff, forestOk: true } : eff, tile, { upgrade });
  if (p.pool.o < ob) return { err: `Faltam 🔨 (custa ${ob}).` };
  if ((aq.v || 0) > p.pool.v) return { err: 'Faltam 💰.' };
  if ((aq.a || 0) > p.pool.a) return { err: 'Faltam 🗳️.' };
  return { card, eff, tile, ob, aq, desmate, upgrade, id };
}

function doBuild(s, p, o) {
  const r = checkBuild(s, p, o);
  if (r.err) return r.err;
  const { card, eff, tile, aq, desmate, upgrade } = r;
  p.pool.o -= r.ob;
  p.pool.v -= aq.v || 0;
  p.pool.a -= aq.a || 0;
  if (o.src === 'row') {
    s.market.row.splice(o.hi, 1);
    p.t.express = 0;
    refillRow(s, o.hi, p);
  } else if (o.src === 'wonder') {
    s.market.vit.splice(o.hi, 1);
    if (s.market.wdeck.length) s.market.vit.push(s.market.wdeck.shift());
  } else p.hand.splice(o.hi, 1);
  if (upgrade) { p.discard.push(tile.b.id); log(s, `🏗️ ${nm(p)} melhora o edifício existente.`, '', p.id); }
  if (desmate) { tile.cleared = true; log(s, `🌲 ${nm(p)} desmata a casa.`, '', p.id); }
  tile.b = { id: card.id };
  if (card.lot) tile.b.v = o.v;
  if (p.nextResPop && eff.zones.includes('RES')) { tile.b.popBonus = p.nextResPop; p.nextResPop = 0; }
  if (card.ferry) linkFerry(p, tile);
  p.t.builtCount += 1;
  p.builtRound = true;
  const wasFirst = !p.t.firstBuildUsed;
  p.t.firstBuildUsed = true;
  if (p.t.firstBuildDisc && wasFirst) p.t.firstBuildDisc = 0;
  if (p.t.encostaDisc && tile.k === 'E') p.t.encostaDisc = 0;
  if (p.t.mestreObras) { p.t.mestreObras = 0; p.pool.v += 1; log(s, `${nm(p)} ganha 💰1 (Mestre de Obras).`, '', p.id); }
  log(s, `🏗️ ${nm(p)} constrói ${eff.name || card.name}${tile.k !== '.' ? ` (${tile.k})` : ''}.`, 'build', p.id);
  (card.fac || []).forEach((f) => advFac(s, p, f, 1));
  if (hasDecree(p, 'D1-02') && (eff.zones.includes('VER') || eff.zones.includes('INF')) && (eff.poll || 0) <= 0 && card.type === 'building') addAppr(s, p, 1, 'Plano Verde');
  if (card.wonder) {
    if (p.wondersScored < 2) { p.wondersScored += 1; addMerit(s, p, 2, 'Obra-Prima'); } else log(s, `${nm(p)} já tem 2 Obras-Prima que pontuam: só o efeito conta.`, '', p.id);
  }
  if (card.onBuild) runOps(s, p, card.onBuild, { tile: tile.id, src: card.name });
  return null;
}
function linkFerry(p, tile) {
  const minor = ['N', 'L'];
  if (minor.includes(tile.isl) && !p.links.includes(tile.isl)) p.links.push(tile.isl);
}

function demolishCost(p) {
  if (p.t.freeDemolish) return { c: 0, use: 'free' };
  if (hasDecree(p, 'D3-01') && !p.t.emergency) return { c: 0, use: 'emergency' };
  return { c: 1, use: null };
}

// ------------------------------------------------------------------ mercado

// A cada rodada a carta mais antiga da Fila Especial vai para o fundo do baralho e entra outra:
// a fila gira mesmo quando ninguém compra.
function rotateRow(s) {
  if (!s.market.row.length || !s.market.deck.length) return;
  const old = s.market.row.shift();
  s.market.deck.push(old);
  log(s, `🔄 A Fila Especial gira: ${CARDS[old].name} sai.`, 'event');
  refillRow(s, s.market.row.length, null, true);
}

function refillRow(s, slot, by, quiet = false) {
  if (!s.market.deck.length) return;
  const id = s.market.deck.shift();
  s.market.row.splice(slot, 0, id);
  if (CARDS[id].alert && !quiet) fisc(s, `${CARDS[id].name} 🔔 entrou na Fila Especial`);
  void by;
}

export function buyCost(s, p, id) {
  if (CARDS[id].regional) return { ...REGIONAL_COST };
  const c = { ...CARDS[id].cost };
  if (id === 'P-01' && p.terrain === 'planicie') c.v = 1;
  if (id === 'P-03' && p.terrain === 'planicie') c.v = 2;
  if (id === 'P-02') { if (p.terrain === 'planicie') c.v = 2; if (s.mods.strike) c.v = (c.v || 0) + 1; }
  return c;
}

// Projetos Regionais: os 3 edifícios do seu terreno ficam sempre à venda para você (1 cópia de cada),
// além de poderem aparecer de graça pela Exploração (Sítio).
export const REGIONAL_COST = { v: 3, a: 1 };
const TCODE = { litoral: 'LIT', montanha: 'MON', planicie: 'PLA', deserto: 'DES', floresta: 'FLO', ilha: 'ILH' };
export function regionalOf(p) {
  if (!p.terrain) return [];
  return Object.values(CARDS).filter((c) => c.regional && c.id.startsWith(`R-${TCODE[p.terrain]}-`)).map((c) => c.id);
}
export function ownsCard(p, id) {
  return [p.deck, p.hand, p.discard, p.exiled || [], p.played || []].some((a) => a.includes(id)) || p.tiles.some((t) => t.b && t.b.id === id);
}
// Limite de cópias de cada Projeto Regional: a Balsa Rápida pode ter 2 (são 2 ilhas menores para ligar).
export const regionalLimit = (id) => (id === 'R-ILH-2' ? 2 : 1);
export function copiesOf(p, id) {
  return [p.deck, p.hand, p.discard, p.exiled || [], p.played || []].reduce((n, a) => n + a.filter((x) => x === id).length, 0) + p.tiles.filter((t) => t.b && t.b.id === id).length;
}
export const regionalFull = (p, id) => copiesOf(p, id) >= regionalLimit(id);

function doBuy(s, p, cmd) {
  let id;
  if (cmd.src === 'regional') {
    id = cmd.key;
    if (!regionalOf(p).includes(id)) return 'Esse projeto é de outro terreno.';
    if (regionalFull(p, id)) return regionalLimit(id) > 1 ? `Você já tem as ${regionalLimit(id)} cópias deste projeto.` : 'Você já tem esse projeto.';
  } else if (cmd.src === 'pile') {
    id = cmd.key;
    if (!STANDARD.includes(id) || s.market.piles[id] <= 0) return 'Pilha esgotada.';
  } else {
    id = s.market.row[cmd.key];
    if (!id) return 'Carta indisponível.';
  }
  const cost = buyCost(s, p, id);
  if ((cost.v || 0) > p.pool.v) return 'Faltam 💰.';
  if ((cost.a || 0) > p.pool.a) return 'Faltam 🗳️.';
  p.pool.v -= cost.v || 0;
  p.pool.a -= cost.a || 0;
  p.discard.push(id);
  p.bought += 1;
  log(s, `🛒 ${nm(p)} compra ${CARDS[id].name}.`, 'buy', p.id);
  if (cmd.src === 'pile') s.market.piles[id] -= 1;
  else if (cmd.src === 'row') { s.market.row.splice(cmd.key, 1); refillRow(s, cmd.key, p); }
  return null;
}

// ------------------------------------------------------------------ Intrigas / Decretos

function intrigueTargetCheck(s, p, tgt, card) {
  if (!tgt || tgt.id === p.id) return 'Escolha outro jogador como alvo.';
  const L = p.lastTarget;
  if (L && L.pid === tgt.id && s.round - L.round <= 1) return 'Não pode mirar o mesmo jogador duas vezes seguidas.';
  if (['I1-02'].includes(card) && tgt.approval <= 2) return 'Quem está com 😊 ≤ 2 não pode ser alvo de perdas de 😊.';
  if (card === 'I3-01') {
    const lead = Math.max(...s.players.filter((q) => q.id !== p.id).map((q) => q.merit));
    if (tgt.merit < lead) return 'Vazamento mira o jogador com mais ⭐.';
  }
  return null;
}

function doIntrigue(s, p, cmd) {
  if (p.t.intrigued) return 'Só 1 Intriga por turno.';
  const id = p.hand[cmd.hi];
  const card = CARDS[id];
  if (!card || card.type !== 'intrigue') return 'Escolha uma Intriga.';
  if (id === 'I2-03') return 'Contra-Inteligência é uma Reação: é usada automaticamente quando você é alvo.';
  let tgt = null;
  if (id !== 'I3-02' && id !== 'I2-04') {
    tgt = P(s, cmd.target);
    const e = intrigueTargetCheck(s, p, tgt, id);
    if (e) return e;
  }
  p.hand.splice(cmd.hi, 1);
  p.exiled.push(id);
  p.t.intrigued = true;
  if (tgt) {
    p.lastTarget = { pid: tgt.id, round: s.round };
    if (tgt.merit >= 8) p.pool.a += 1;
  }
  log(s, `🎭 ${nm(p)} usa ${card.name}${tgt ? ` contra ${nm(tgt)}` : ''}.`, 'fisc', p.id);
  if (tgt && tgt.hand.includes('I2-03')) {
    ask(s, tgt, 'reaction', { card: id, from: p.id });
    return null;
  }
  applyIntrigue(s, p, tgt, id);
  return null;
}

function applyIntrigue(s, p, tgt, id) {
  switch (id) {
    case 'I1-01': addCubes(s, tgt, 2); break;
    case 'I1-02': addAppr(s, tgt, -2, 'Campanha de Boatos'); break;
    case 'I1-03': tgt.next.minusV = (tgt.next.minusV || 0) + 2; break;
    case 'I2-01': tgt.next.minusO = (tgt.next.minusO || 0) + 2; break;
    case 'I2-02': {
      const tiles = ownBuildingTiles(s, tgt, 'any');
      if (tiles.length) ask(s, p, 'tile', { mode: 'off', tiles, owner: tgt.id, until: 'next' });
      break;
    }
    case 'I2-04': ask(s, p, 'faction', { n: 1, mode: 'intr04', excl: [] }); break;
    case 'I3-01': addCubes(s, tgt, 3); break;
    case 'I3-02': fisc(s, 'Auditoria Surpresa'); break;
    case 'I3-03': ask(s, p, 'faction', { n: 1, mode: 'alliance', excl: [], target: tgt.id }); break;
    default: break;
  }
}

function doDecree(s, p, cmd) {
  const id = p.hand[cmd.hi];
  const card = CARDS[id];
  if (!card || card.type !== 'decree') return 'Escolha um Decreto.';
  if (cmd.slot !== 0 && cmd.slot !== 1) return 'Escolha um espaço do Gabinete.';
  p.hand.splice(cmd.hi, 1);
  const old = p.cabinet[cmd.slot];
  if (old) { p.exiled.push(old); log(s, `${nm(p)} substitui um Decreto (exilado).`, '', p.id); }
  p.cabinet[cmd.slot] = id;
  log(s, `📋 ${nm(p)} assina o Decreto ${card.name}.`, 'build', p.id);
  card.fac.forEach((f) => advFac(s, p, f, 1));
  if (id === 'D2-03') addAppr(s, p, -2, 'Reforma Tributária');
  p.approval = Math.min(p.approval, apprMax(p));
  return null;
}

// ------------------------------------------------------------------ turno

function freshT() {
  return { builtCount: 0, claimed: false, intrigued: false, firstBuildUsed: false, firstBuildDisc: 0, encostaDisc: 0, startTreasury: 0, rota: 0, treasuryBonus: 0, freeDemolish: 0, emergency: 0, express: 0, mestreObras: 0, recycled: 0, rotaTwice: 0, played: 0 };
}

function beginTurn(s) {
  const p = P(s, s.order[s.turnIdx]);
  p.tiles.forEach((t) => { if (t.b && t.b.off && t.b.off.k === 'turn') t.b.off = null; });
  p.t = freshT();
  p.t.startTreasury = p.treasury;
  const c = calc(s, p);
  p.pool = { v: p.treasury + c.inc.v, o: c.inc.o, a: c.inc.a };
  p.treasury = 0;
  if (p.next.minusV) p.pool.v = Math.max(0, p.pool.v - p.next.minusV);
  if (p.next.minusO) p.pool.o = Math.max(0, p.pool.o - p.next.minusO);
  const ex = p.next.capE || 0;
  const defE = Math.max(0, -(c.sur.e + ex));
  const defW = Math.max(0, -c.sur.w);
  const loss = Math.min(3, defE + defW);
  p.next = {};
  log(s, `▶ Turno de ${nm(p)} — renda 💰${p.pool.v} 🔨${p.pool.o} 🗳️${p.pool.a}.`, 'turn', p.id);
  if (loss) addAppr(s, p, -loss, 'déficit de ⚡/💧');
  if (p.approval >= 8) p.pool.a += 1;
}

function endTurn(s) {
  const p = P(s, s.order[s.turnIdx]);
  p.discard.push(...p.hand, ...p.played);
  p.hand = [];
  p.played = [];
  p.treasury = Math.min(p.pool.v, tmax(s, p));
  p.pool = { v: 0, o: 0, a: 0 };
  const c = calc(s, p);
  let n = HAND;
  if (p.approval <= 2) n -= 1;
  if (c.bigLib) n += 1;
  draw(s, p, n);
  s.turnIdx += 1;
  if (s.turnIdx >= s.order.length) endRound(s);
  else beginTurn(s);
}

// ------------------------------------------------------------------ rodada

function metricVal(s, p, m) {
  const c = calc(s, p);
  switch (m) {
    case 'pop': return c.pop;
    case 'appr': return p.approval;
    case 'sw': return c.sur.w;
    case 'se': return c.sur.e;
    case 'poll': return c.poll;
    case 'bld': return c.built;
    case 'facs': return FAC_KEYS.reduce((a, k) => a + p.fac[k], 0);
    case 'treasury': return p.treasury;
    case 'cubes': return p.cubesBag;
    case 'incv': return c.inc.v;
    case 'inco': return c.inc.o;
    case 'ver': return c.zn.VER;
    default: return 0;
  }
}

export function auditMetric(s, p) {
  const rd = ROUNDS.find((r) => r.id === s.card);
  return metricVal(s, p, rd.metric);
}

function audit(s) {
  const rd = ROUNDS.find((r) => r.id === s.card);
  log(s, `📊 Auditoria: ${rd.au}.`, 'audit');
  if (s.solo) {
    const p = s.players[0];
    const v = metricVal(s, p, rd.metric);
    const ref = RIVAL[s.level].ref;
    const win = rd.low ? v <= 2 : v >= ref;
    if (win) { p.seals += 1; p.treasury += 1; log(s, `🎖️ Você vence a Auditoria (${v}) — Selo e +💰1 no Tesouro.`, 'merit'); } else if (s.level === 'veterano' || s.level === 'mestre') { s.rival.seals += 1; log(s, `🎖️ O Rival ganha um Selo (você fez ${v}).`, 'bad'); }
    return;
  }
  const vals = s.players.map((p) => ({ p, v: metricVal(s, p, rd.metric), pop: metricVal(s, p, 'pop') }));
  vals.sort((a, b) => (rd.low ? a.v - b.v : b.v - a.v) || (rd.metric === 'poll' ? b.pop - a.pop : 0));
  const key = (x) => (rd.metric === 'poll' ? `${x.v}|${x.pop}` : `${x.v}`);
  const groups = [];
  vals.forEach((x) => { const g = groups[groups.length - 1]; if (g && key(g[0]) === key(x)) g.push(x); else groups.push([x]); });
  const first = groups[0];
  if (first.length === 1) {
    const p = first[0].p;
    p.seals += 1; p.treasury += 1;
    log(s, `🎖️ ${nm(p)} vence a Auditoria (${first[0].v}): Selo e +💰1 no Tesouro.`, 'merit', p.id);
    if (s.players.length > 2 && groups[1]) groups[1].forEach((x) => { x.p.treasury += 1; log(s, `${nm(x.p)} fica em 2º na Auditoria: +💰1 no Tesouro.`, '', x.p.id); });
  } else if (s.players.length > 2) {
    first.forEach((x) => { x.p.treasury += 1; log(s, `${nm(x.p)} empata na Auditoria: +💰1 no Tesouro.`, '', x.p.id); });
  } else log(s, 'Empate na Auditoria: ninguém recebe.');
}

function endRound(s) {
  audit(s);
  s.players.forEach((p) => {
    const c = calc(s, p);
    if (c.poll >= 6) addAppr(s, p, -1, 'Poluição ≥ 6');
    [...c.act].forEach((i) => { if (p.tiles[i].b.id === 'E1-04' && p.approval <= 4) addAppr(s, p, 1, 'Posto de Saúde'); });
    if (hasDecree(p, 'D2-01') && !p.builtRound) addAppr(s, p, -1, 'Pacote de Estímulo (sem obras)');
    if (p.merit >= 6) addCubes(s, p, 1);
    p.builtRound = false;
    while (p.seals >= 2) { p.seals -= 2; addMerit(s, p, 1, '2 Selos'); }
    if (s.mods.cut) p.treasury = Math.min(p.treasury, 1);
  });
  if (s.solo) rivalStep(s);
  if (s.over) return;
  if (s.finalRound || s.round >= MAX_ROUNDS) return finishByMerit(s);
  s.firstIdx = (s.firstIdx + 1) % s.players.length;
  rotateRow(s);
  return startRound(s);
}

function rivalStep(s) {
  const r = s.rival;
  const g = rivalGain(s.level, s.round);
  if (g) { r.merit += g; log(s, `🤖 O Rival avança ${g} ⭐ → ${r.merit}.`, 'bad'); }
  while (r.seals >= 2) { r.seals -= 2; r.merit += 1; log(s, '🤖 O Rival troca Selos por ⭐1.', 'bad'); }
  // compra a carta mais à esquerda da Fila Especial
  if (s.market.row.length) {
    const id = s.market.row.shift();
    log(s, `🤖 O Rival compra ${CARDS[id].name} da Fila Especial.`, 'bad');
    refillRow(s, 0, null);
  }
  if (s.round % 3 === 0) {
    const sl = s.goals.slots.find((x) => x.gold == null && !x.done);
    if (sl) { sl.gold = 'R'; log(s, `🤖 O Rival toma a vaga Ouro de ${GOALS.find((x) => x.id === sl.id).name}.`, 'bad'); refillGoals(s); }
  }
  if (r.merit >= s.target) {
    s.finalRound = true;
  }
}

function applyEvent(s, id) {
  const m = s.mods;
  const all = s.players;
  switch (id) {
    case 'RD-01': all.forEach((p) => { if (calc(s, p).pop >= 6) { p.treasury += 2; log(s, `${nm(p)} ganha 💰2 no Tesouro.`, '', p.id); } }); break;
    case 'RD-02':
      m.rain = true;
      all.filter((p) => p.terrain === 'litoral' || p.terrain === 'ilha').forEach((p) => {
        const tiles = ownBuildingTiles(s, p, 'O');
        if (tiles.length) ask(s, p, 'tile', { mode: 'off', tiles, owner: p.id, until: 'round' });
      });
      break;
    case 'RD-03': m.heat = true; all.filter((p) => p.terrain === 'floresta').forEach((p) => addAppr(s, p, -1, 'Onda de Calor')); break;
    case 'RD-04': m.strike = true; break;
    case 'RD-05': all.forEach((p) => addAppr(s, p, 1, 'Feriado Nacional')); break;
    case 'RD-06': m.energy = true; break;
    case 'RD-07': {
      const low = Math.min(...all.map((p) => p.merit));
      all.filter((p) => p.merit === low).forEach((p) => ask(s, p, 'faction', { n: 1, mode: 'adv', excl: [] }));
      break;
    }
    case 'RD-08':
      all.filter((p) => p.terrain === 'montanha').forEach((p) => {
        const tiles = ownBuildingTiles(s, p, 'any');
        if (tiles.length) ask(s, p, 'tile', { mode: 'off', tiles, owner: p.id, until: 'round' });
      });
      {
        const out = s.market.row.splice(0, 2);
        log(s, `A Fila Especial perde ${out.length} carta(s) mais antigas.`);
        for (let i = 0; i < out.length; i++) refillRow(s, s.market.row.length, null);
      }
      break;
    case 'RD-09': fisc(s, 'Escândalo Nacional', 1); break;
    case 'RD-10': m.fair = true; break;
    case 'RD-11': all.forEach((p) => { const n = Math.min(3, calc(s, p).zn.VER); if (n) addAppr(s, p, n, 'Sinal Verde'); }); break;
    case 'RD-12': m.cut = true; break;
    default: break;
  }
}

function startRound(s) {
  s.round += 1;
  s.mods = {};
  s.card = s.roundDeck[s.round - 1];
  s.tension = tension(s.round);
  s.players.forEach((p) => p.tiles.forEach((t) => { if (t.b && t.b.off && t.b.off.k === 'round' && s.round > t.b.off.r) t.b.off = null; }));
  const N = s.players.length;
  // rodada 1: ordem inversa (N→1); depois, o token anda no sentido horário a partir do assento 1
  s.order = s.round === 1 && ROUND1_REVERSE ? [...Array(N).keys()].reverse() : [...Array(N).keys()].map((i) => (s.firstIdx + i) % N);
  s.turnIdx = 0;
  const rd = ROUNDS.find((r) => r.id === s.card);
  log(s, `—— Rodada ${s.round} ——`, 'round');
  log(s, `📰 ${rd.name}: ${rd.ev}`, 'event');
  applyEvent(s, s.card);
  s.cont = 'begin';
  settle(s);
}

function settle(s) {
  if (s.over || s.pending.length) return;
  if (s.cont === 'begin') {
    s.cont = null;
    beginTurn(s);
  }
}

function finishByMerit(s) {
  const ps = s.players;
  if (s.solo) {
    const p = ps[0];
    const r = s.rival;
    let win;
    if (p.merit >= s.target && r.merit >= s.target) win = true;
    else if (r.merit >= s.target) win = false;
    else if (p.merit >= s.target) win = true;
    else win = p.merit > r.merit;
    return finish(s, win ? 'Vitória sobre o Rival.' : 'Derrota: o Rival chegou primeiro.', win ? [0] : []);
  }
  const rank = [...ps].sort((a, b) => b.merit - a.merit || b.approval - a.approval || calc(s, a).poll - calc(s, b).poll || b.treasury - a.treasury);
  const top = rank[0];
  const same = (x) => x.merit === top.merit && x.approval === top.approval && calc(s, x).poll === calc(s, top).poll && x.treasury === top.treasury;
  return finish(s, s.finalRound ? `Alguém chegou a ⭐${s.target}` : 'Fim do deck de Rodada', rank.filter(same).map((x) => x.id));
}
function finish(s, reason, winners) {
  s.over = true;
  s.winners = winners;
  s.reason = reason;
  log(s, `🏆 Fim de jogo — ${reason}`, 'merit');
}

// ------------------------------------------------------------------ criação

function newPlayer(id, cfg) {
  return {
    id, name: cfg.name, bot: !!cfg.bot, color: PLAYER_COLORS[id], seat: id, terrain: null,
    merit: 0, seals: 0, approval: 6, treasury: 0,
    deck: [], hand: [], discard: [], exiled: [], played: [],
    tiles: [], cabinet: [null, null], fac: { tec: 0, ver: 0, emp: 0, sin: 0 }, facMark: {},
    cubesSupply: 10, cubesBag: 0, pool: { v: 0, o: 0, a: 0 },
    ex: { deck: [], disc: [] }, caps: { e: 0, w: 0 }, links: [],
    wondersScored: 0, regionalDone: false, explored: 0, fiscStreak: 0, crises: 0, crisisRound: -1, investRound: -1, tideRound: -1,
    lastTarget: null, nextResPop: 0, builtRound: false, bought: 0,
    t: freshT(), next: {},
  };
}

export function newGame({ players, solo = false, level = 'normal', target = 10, noIntrigues = false, seed } = {}) {
  const N = players.length;
  const s = {
    v: 2, rng: (seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0, solo, level, target, noIntrigues,
    players: players.map((c, i) => newPlayer(i, c)), phase: 'draft', round: 0, order: [], turnIdx: 0, firstIdx: 0,
    over: false, winners: [], reason: '', finalRound: false, mods: {}, card: null, tension: 3, cont: null,
    pending: [], log: [], tokens: { tec: null, ver: null, emp: null, sin: null },
    market: { piles: {}, row: [], deck: [], vit: [], wdeck: [] }, goals: { slots: [], deck: [] }, bag: { neutral: SETUP[N][2] },
    roundDeck: [], rival: solo ? { merit: 0, seals: 0 } : null,
    stats: { fisc: 0, invest: 0, crises: 0, src: {} },
  };
  const pool = shuffle(s, TERRAIN_IDS);
  s.draft = { pool: solo || N >= 6 ? TERRAIN_IDS : pool.slice(0, N + 1), idx: 0 };
  if (solo) s.draft.pool = TERRAIN_IDS;
  s.players.forEach((p) => { p.deck = shuffle(s, STARTER); });
  log(s, 'A convenção do Partido começou. Escolham seus terrenos.', 'round');
  return s;
}

function pickTerrain(s, p, tid) {
  const d = s.draft;
  if (!d.pool.includes(tid)) return 'Terreno indisponível.';
  p.terrain = tid;
  d.pool = d.pool.filter((x) => x !== tid);
  p.tiles = makeTiles(tid);
  p.ex.deck = shuffle(s, EXPLORE[tid].map((c) => c.id));
  log(s, `${nm(p)} escolhe ${TERRAINS[tid].name}.`, '', p.id);
  if (!s.solo) {
    const pk = packageFor(s.players.length, p.seat);
    if (pk.treasury) p.treasury += pk.treasury;
    if (pk.appr) p.approval += pk.appr;
    if (pk.pick) {
      const tier1 = SPECIAL_TIERS[0].filter((id) => (pk.pick.only === 'admin' ? CARDS[id].type === 'admin' : !(s.noIntrigues && CARDS[id].type === 'intrigue')));
      const cards = shuffle(s, tier1).slice(0, pk.pick.n);
      ask(s, p, 'pick', { cards });
    }
  }
  d.idx += 1;
  if (d.idx >= s.players.length) startPlay(s);
  return null;
}

function startPlay(s) {
  const N = s.players.length;
  s.phase = 'play';
  const [nGoals, nWonders] = SETUP[N];
  s.market.piles = { ...STD_QTY, 'P-01': loteamentoQty(N) }; // Loteamento escala com a mesa
  const tiers = SPECIAL_TIERS.map((t) => shuffle(s, t.filter((id) => !(s.noIntrigues && CARDS[id].type === 'intrigue'))));
  const deck = [...tiers[0], ...tiers[1], ...tiers[2]];
  s.market.row = deck.splice(0, 6);
  s.market.deck = deck;
  const w = shuffle(s, WONDERS);
  s.market.vit = w.splice(0, nWonders);
  s.market.wdeck = w;
  const gd = shuffle(s, GOALS.map((g) => g.id));
  s.goals.slots = gd.splice(0, nGoals).map((id) => ({ id, gold: null, silver: null }));
  s.goals.deck = gd;
  s.roundDeck = shuffle(s, ROUNDS.map((r) => r.id));
  s.players.forEach((p) => draw(s, p, HAND));
  s.firstIdx = ROUND1_REVERSE ? N - 1 : 0; // a rodada 1 começa pelo assento 1; o token anda a cada rodada
  log(s, 'Todos os terrenos foram escolhidos. Começa a Rodada 1 (ordem inversa).', 'round');
  startRound(s);
}

// ------------------------------------------------------------------ comandos

export function exec(s, cmd) {
  if (s.over) return 'A partida terminou.';
  if (s.phase === 'draft') {
    if (cmd.t !== 'pick') {
      if (cmd.t === 'choose') return resolveAndSettle(s, cmd);
      return 'Escolham os terrenos primeiro.';
    }
    if (s.pending.length) return 'Resolva a decisão pendente.';
    return pickTerrain(s, s.players[s.draft.idx], cmd.terrain);
  }
  if (cmd.t === 'choose') return resolveAndSettle(s, cmd);
  if (s.pending.length) return 'Há uma decisão pendente.';
  const p = P(s, s.order[s.turnIdx]);
  switch (cmd.t) {
    case 'play': {
      const id = p.hand[cmd.hi];
      const c = CARDS[id];
      if (!c) return 'Escolha uma carta.';
      if (!['basic', 'standard', 'admin'].includes(c.type)) return c.type === 'building' ? 'Edificações são construídas na grade.' : 'Use o comando próprio para esta carta.';
      p.hand.splice(cmd.hi, 1);
      p.played.push(id);
      p.t.played += 1;
      log(s, `🃏 ${nm(p)} joga ${c.name}.`, '', p.id);
      c.fac.forEach((f) => advFac(s, p, f, 1));
      runOps(s, p, c.fx, { src: c.name });
      return null;
    }
    case 'buy': return doBuy(s, p, cmd);
    case 'build': return doBuild(s, p, { ...cmd, src: cmd.src || 'hand' });
    case 'wonder': return doBuild(s, p, { ...cmd, src: 'wonder' });
    case 'demolish': {
      const tile = p.tiles[cmd.tile];
      if (!tile || !tile.b) return 'Não há edifício aqui.';
      if (tile.b.id === 'PREF') return 'A Prefeitura não pode ser demolida.';
      const dc = demolishCost(p);
      if (p.pool.o < dc.c) return 'Faltam 🔨.';
      p.pool.o -= dc.c;
      if (dc.use === 'free') p.t.freeDemolish = 0;
      if (dc.use === 'emergency') p.t.emergency = 1;
      const old = tile.b;
      tile.b = null;
      if (!CARDS[old.id].wonder) p.discard.push(old.id);
      log(s, `🧨 ${nm(p)} demole ${def(old).name}.`, '', p.id);
      return null;
    }
    case 'sell': {
      const c = CARDS[p.hand[cmd.hi]];
      if (!c || c.type !== 'building') return 'Só Edificações podem ser vendidas como lote.';
      p.discard.push(p.hand[cmd.hi]);
      p.hand.splice(cmd.hi, 1);
      p.pool.v += 1;
      log(s, `${nm(p)} vende ${c.name} como lote (+💰1).`, '', p.id);
      return null;
    }
    case 'claim': return doClaim(s, p, cmd);
    case 'seals':
      if (p.seals < 2) return 'Precisa de 2 Selos.';
      p.seals -= 2;
      addMerit(s, p, 1, '2 Selos');
      return null;
    case 'intrigue': return doIntrigue(s, p, cmd);
    case 'decree': return doDecree(s, p, cmd);
    case 'ability': {
      if (cmd.id === 'rota') {
        if (p.terrain !== 'ilha') return 'Só na Ilha.';
        if (p.t.rota >= (p.t.rotaTwice ? 2 : 1)) return 'Rota Marítima já usada neste turno.';
        if (cmd.dir === 'v2a') { if (p.pool.v < 2) return 'Faltam 💰.'; p.pool.v -= 2; p.pool.a += 1; } else { if (p.pool.a < 1) return 'Faltam 🗳️.'; p.pool.a -= 1; p.pool.v += 2; }
        p.t.rota += 1;
        return null;
      }
      if (cmd.id === 'recycle') {
        if (!calc(s, p).recycle) return 'Precisa da Usina de Reciclagem e Energia ativa.';
        if (p.t.recycled) return 'Já usou neste turno.';
        const id = p.hand[cmd.hi];
        if (!id) return 'Escolha uma carta da mão.';
        p.hand.splice(cmd.hi, 1);
        p.exiled.push(id);
        p.t.recycled = 1;
        log(s, `♻️ ${nm(p)} exila ${CARDS[id].name}.`, '', p.id);
        return null;
      }
      return 'Habilidade desconhecida.';
    }
    case 'end':
      endTurn(s);
      settle(s);
      return null;
    default: return 'Comando desconhecido.';
  }
}

function resolveAndSettle(s, cmd) {
  const e = resolvePending(s, cmd);
  if (e) return e;
  settle(s);
  return null;
}

// Aplica um comando sobre uma cópia do estado. Devolve { state } ou { error }.
export function apply(state, cmd) {
  const s = structuredClone(state);
  const e = exec(s, cmd);
  if (e) return { error: e, state };
  settle(s);
  return { state: s };
}

// Quem deve agir agora (para UI e bots): a pendência na frente da fila, ou o jogador da vez.
export function actor(s) {
  if (s.over) return null;
  if (s.pending.length) return s.pending[0].pid;
  if (s.phase === 'draft') return s.draft.idx;
  return s.order[s.turnIdx];
}

export function currentPlayer(s) { return P(s, s.order[s.turnIdx]); }
export function leaderOf(s, pid) {
  return [...s.players].filter((q) => q.id !== pid).sort((a, b) => b.merit - a.merit)[0];
}
export { CARDS, TERRAINS, GOALS, ROUNDS };
