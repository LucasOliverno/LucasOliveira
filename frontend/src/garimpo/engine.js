// GARIMPO — motor de regras. Puro (sem React/DOM): roda no navegador e no Node (simulação).
// Fonte das regras: GARIMPO/00_design.md (base) e 02_dlcs.md (Cérbero, Medusa).
// exec(s, ação) devolve null quando deu certo ou uma string com o erro. Sorteios usam PRNG com semente no estado.
import {
  HAND, ROW_SIZE, MAX_FOLEGO, CUBES_PER_PLAYER, START_STONES, FURY_DRAWS, SELO, WATER_START, WATER_DMG,
  PLAYER_COLORS, BOCA, BARRACAO_NODE, CRYSTALS_PER_GEODE, RELICS, MASCATE, CARDS, STARTER, FIXED, FIXED_BEAST,
  tunnelFor, DLCS, LEVELS, ROOMS, NINHO_RELIC, DECK_OF_LEVEL, TILE_MIN_LEVEL,
} from './data.js';
import * as M from './map.js';

export { CARDS, RELICS, MASCATE, DLCS, LEVELS, ROOMS };
export const { lvOf, kindOf, neighbors, edgeBetween, nodeIds, stubs, roomName } = M;

// ------------------------------------------------------------------ RNG, log, utilidades
export function rnd(s) {
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
  s.log.push({ n: s.turnNo, msg, kind, pid });
  if (s.log.length > (s.logCap || 300)) s.log.splice(0, s.log.length - (s.logCap || 300));
}
export const ROUND_LIMIT = +(globalThis.process?.env?.ROUND_LIMIT ?? 15); // (PT) da rodada 16 em diante a água começa de qualquer jeito
export const START_CUBES = (globalThis.process?.env?.START_CUBES || '1,0,0,0').split(',').map(Number);
export const SEAT_BONUS = (globalThis.process?.env?.SEAT_BONUS || '0,0,0,0').split(',').map(Number);
export const card = (id) => CARDS[id];
export const currentPlayer = (s) => s.players[s.order[s.turn]];
export const hasDlc = (s, k) => s.dlc.includes(k);
export const hasItem = (p, k) => p.items.includes(k);
export const relicCap = (p) => (hasItem(p, 'mochila') ? 2 : 1);
export const inMine = (p) => p.status === 'in';
export const allCards = (p) => [...p.deck, ...p.hand, ...p.discard, ...p.play];
// Relíquias de ✦20 ou mais são pesadas: +1 🔦 em cada escada subindo
export const heavyCount = (p) => p.relics.filter((r) => RELICS[r].pts >= 20).length;

// ------------------------------------------------------------------ grafo
// vizinhos para monstros (sobem poços, ignoram o elevador, respeitam desabamentos)
function monsterAdj(s, node) {
  const up = s.map.edges.filter((e) => e.type === 'shaft' && e.b === node).map((e) => ({ e, to: e.a }));
  return M.neighbors(s, node).concat(up).filter(({ e }) => e.type !== 'elev' && !s.rubble.includes(e.key)).map(({ to }) => to);
}
export function bfsDist(s, from, adjFn = (n) => monsterAdj(s, n)) {
  const d = { [from]: 0 };
  const q = [from];
  while (q.length) {
    const n = q.shift();
    for (const m of adjFn(n)) if (d[m] === undefined) { d[m] = d[n] + 1; q.push(m); }
  }
  return d;
}

// ------------------------------------------------------------------ novo jogo
export function newGame({ players, seed = Date.now() % 1e9, dlc = [], map = 'explorar' } = {}) {
  if (!players?.length || players.length > 4) throw new Error('1 a 4 jogadores');
  const s = {
    v: 2, seed, rng: seed >>> 0, dlc: [...dlc], log: [], logCap: 300, turnNo: 1, over: false, winners: [],
    pending: [], endStage: null,
    players: [], order: players.map((_, i) => i), turn: 0,
    tunnel: [], tunnelOut: [], row: [], fixedQty: Object.fromEntries(FIXED.map((id) => [id, CARDS[id].qty])),
    bag: { stone: START_STONES, p: players.map(() => 0) }, fury: 1, furyExtra: 0,
    grisu: [], crystals: {}, relics: {}, mascate: Object.fromEntries(Object.entries(MASCATE).map(([k, m]) => [k, m.qty])),
    water: null, clock: null, cerb: null, medusa: null, stats: { furies: 0, cubesHit: 0, bites: 0, gazes: 0, tiles: 0 },
  };
  s.map = map === 'classico' ? M.classicMap() : M.exploreMap(() => rnd(s), s.dlc);
  s.rubble = s.map.rubble;
  for (const id of M.nodeIds(s)) onReveal(s, id, true);
  if (map === 'classico') {
    for (const k of s.dlc) { const r = DLCS[k]?.relic; if (r) s.relics[r.node] = r.id; }
    if (hasDlc(s, 'cerbero')) s.cerb = { node: DLCS.cerbero.lair, lair: DLCS.cerbero.lair, awake: 0 };
    if (hasDlc(s, 'medusa')) s.medusa = { node: DLCS.medusa.start, lair: DLCS.medusa.start };
  }
  s.players = players.map((pl, i) => ({
    id: i, name: pl.name || `Garimpeiro ${i + 1}`, bot: !!pl.bot, level: pl.level || 'normal', greed: pl.greed, color: PLAYER_COLORS[i],
    node: BOCA, folego: MAX_FOLEGO, cubes: CUBES_PER_PLAYER, gold: 0, crystals: 0, relics: [], items: [],
    deck: shuffle(s, STARTER), hand: [], discard: [], play: [], status: 'in', deadLv: null, geodes: [], visited: [],
    mirror: false, area: 0, t: null,
  }));
  // compensação de ordem: quem joga antes começa com mais cubos na Bateia (1º: 3, 2º: 2, 3º: 1, 4º: 0)
  s.players.forEach((p, i) => { const k = START_CUBES[i] || 0; p.cubes -= k; s.bag.p[i] += k; });
  s.tunnel = shuffle(s, tunnelFor(s.dlc));
  // setup: cartas com 🌋 ou Perigos que saírem na Fila inicial voltam para o baralho
  const back = [];
  while (s.row.length < ROW_SIZE && s.tunnel.length) {
    const id = s.tunnel.pop();
    const c = CARDS[id];
    if (c.quake || c.type === 'hazard' || c.onEnter) back.push(id); else s.row.push(id);
  }
  s.tunnel = shuffle(s, [...s.tunnel, ...back]);
  for (const p of s.players) draw(s, p, HAND);
  startTurn(s);
  return s;
}

// ------------------------------------------------------------------ revelar sala
// Chamado quando uma sala aparece (e para as salas do mapa inicial)
function onReveal(s, id, setup = false) {
  const n = s.map.nodes[id];
  const kind = n.kind;
  if (kind === 'geodo') s.crystals[id] = CRYSTALS_PER_GEODE;
  if (n.relic) s.relics[id] = n.relic;
  if (s.map.mode !== 'explorar') return;
  if (kind === 'altar') {
    const order = { rasa: ['rasa', 'media', 'funda'], media: ['media', 'funda'], funda: ['funda'] }[DECK_OF_LEVEL[n.lv]];
    const tier = order.find((k) => s.map.piles[k].length);
    if (tier) {
      const r = s.map.piles[tier].shift();
      s.relics[id] = r;
      if (!setup) log(s, `Uma Relíquia aparece no Altar: ${RELICS[r].name} (✦${RELICS[r].pts})`, 'relic');
    }
  }
  if (kind === 'ninho') { s.relics[id] = NINHO_RELIC; log(s, 'O Ninho da Mãe-do-Ouro foi encontrado! A Escama (✦35) está lá', 'relic'); }
  if (kind === 'covil' && hasDlc(s, 'cerbero') && !s.cerb) { s.cerb = { node: id, lair: id, awake: 0 }; log(s, 'O Portão de Bronze se abre: o Cérbero dorme lá dentro', 'boss'); }
  if (kind === 'estatuas' && hasDlc(s, 'medusa') && !s.medusa) { s.medusa = { node: id, lair: id }; log(s, 'Jardim de Estátuas: a Medusa desperta', 'boss'); }
}

// ------------------------------------------------------------------ baralho
function draw(s, p, n) {
  for (let i = 0; i < n; i++) {
    if (!p.deck.length) {
      if (!p.discard.length) return;
      p.deck = shuffle(s, p.discard);
      p.discard = [];
    }
    p.hand.push(p.deck.pop());
  }
}
function gain(s, p, id) {
  p.discard.push(id);
  const a = CARDS[id].acq;
  if (a?.gold) p.gold += a.gold;
  if (a?.est) p.area += a.est;
}
function hurt(s, p, n, why) {
  if (!inMine(p) || n <= 0) return;
  p.folego = Math.max(0, p.folego - n);
  log(s, `${p.name} perde 🫧${n} (${why})`, 'dmg', p.id);
  if (p.folego === 0) bury(s, p);
}
function heal(p, n) { p.folego = Math.min(MAX_FOLEGO, p.folego + n); }
function bury(s, p) {
  p.status = 'dead';
  p.deadLv = lvOf(s, p.node);
  log(s, `${p.name} ficou soterrado em ${LEVELS[p.deadLv]}`, 'dead', p.id);
  startWater(s, p.id);
}
function startWater(s, pid, why = '') {
  if (s.water !== null) return;
  s.water = WATER_START;
  s.clock = pid;
  log(s, `A mina começa a alagar${why ? ` (${why})` : ''}: a água sobe um nível a cada rodada`, 'water');
}

// ------------------------------------------------------------------ turno
function startTurn(s) {
  const p = currentPlayer(s);
  p.t = { luz: 0, prosa: 0, pic: 0, bright: false, ropeUp: false, dyn: 0, freeRide: 0, darkCheap: false, calm: 0, lure: 0, mascate: false, rest: false };
  p.area = 0;
  if (s.water !== null && lvOf(s, p.node) >= s.water) hurt(s, p, WATER_DMG, 'água');
  if (!inMine(p)) return nextTurn(s);
  if (hasItem(p, 'capacete')) p.t.luz += 1;
  if (p.relics.length) p.t.luz += 1; // Adrenalina: com Relíquia na mão você corre
  if (s.turnNo === 1) p.t.luz += SEAT_BONUS[s.turn] || 0; // compensação de ordem no 1º turno
}

function nextTurn(s) {
  if (s.over) return;
  for (let guard = 0; guard < 64; guard++) {
    if (!s.players.some(inMine)) return gameOver(s);
    s.turn = (s.turn + 1) % s.order.length;
    if (s.turn === 0) {
      s.turnNo++;
      // relógio da água: sobe uma vez por rodada depois que começou
      if (s.water !== null) {
        s.water -= 1;
        if (s.water <= 5) log(s, `A água sobe: ${LEVELS[s.water]} alagada`, 'water');
        else log(s, `A água sobe (faltam ${s.water - 5} rodada(s) para alagar a Câmara)`, 'water');
        if (s.water <= 1) return flood(s);
      }
      if (s.water === null && s.turnNo > ROUND_LIMIT) startWater(s, null, `rodada ${ROUND_LIMIT + 1}: a mina não aguenta mais`);
    }
    const p = currentPlayer(s);
    if (inMine(p)) return startTurn(s);
  }
  gameOver(s);
}

function flood(s) {
  for (const p of s.players) if (inMine(p)) { p.status = 'dead'; p.deadLv = lvOf(s, p.node); log(s, `${p.name} ficou preso pela água em ${LEVELS[p.deadLv]}`, 'dead', p.id); }
  gameOver(s);
}

// ------------------------------------------------------------------ pontuação
export function scoreOf(s, p) {
  const cards = allCards(p).reduce((a, id) => a + (CARDS[id].pts || 0), 0);
  const relics = p.relics.reduce((a, r) => a + RELICS[r].pts, 0);
  const items = p.items.reduce((a, k) => a + (MASCATE[k].pts || 0), 0);
  const selo = p.status === 'out' ? SELO : 0;
  const base = { gold: p.gold, crystals: p.crystals * 5, relics, cards, items, selo };
  let total = Object.values(base).reduce((a, b) => a + b, 0);
  let note = '';
  if (p.status === 'dead' && p.deadLv >= 2) { total = Math.floor((total - relics) / 2); note = 'soterrado fundo: metade, Relíquias valem 0'; }
  else if (p.status === 'dead') note = 'resgatado pela turma';
  return { ...base, total, note };
}
function gameOver(s) {
  if (s.over) return;
  s.over = true;
  const sc = s.players.map((p) => scoreOf(s, p).total);
  const best = Math.max(...sc);
  let w = s.players.filter((p, i) => sc[i] === best);
  if (w.length > 1) { const f = Math.max(...w.map((p) => p.folego)); w = w.filter((p) => p.folego === f); }
  s.winners = w.map((p) => p.id);
  log(s, `Fim de jogo. Vencedor: ${w.map((p) => p.name).join(' e ')} (✦${best})`, 'over');
}

// ------------------------------------------------------------------ custo de movimento
// Devolve { luz, prosa, est, den, err }. Não aplica nada.
export function moveCost(s, p, from, to) {
  const e = M.edgeBetween(s, from, to);
  if (!e) return { err: 'sem passagem' };
  if (s.rubble.includes(e.key)) return { err: 'desabamento bloqueia a passagem' };
  const c = { luz: 0, prosa: 0, est: 0, den: !!e.den, e };
  if (e.type === 't' || e.type === 'rail') c.luz = 1;
  else if (e.type === 'dark') c.luz = p.t.bright || p.t.darkCheap ? 1 : 2;
  else if (e.type === 'shaft') { c.luz = 1; c.est = 2; }
  else if (e.type === 'elev') { c.prosa = 2; c.est = 1; }
  else if (e.type === 'lad') {
    if (from === e.a) c.luz = 1; // descendo
    else c.luz = p.t.ropeUp ? 1 : 2 + (hasItem(p, 'corda') ? 0 : heavyCount(p));
  }
  return c;
}

function arrive(s, p, node) {
  p.node = node;
  if (s.grisu.includes(node)) hurt(s, p, 1, 'Grisu');
  if (!inMine(p)) return;
  roomEffects(s, p, node);
  if (!inMine(p)) return;
  if (s.cerb && s.cerb.node === node && s.cerb.awake > 0) { s.stats.bites++; hurt(s, p, DLCS.cerbero.biteDmg, 'mordida do Cérbero'); }
  if (!inMine(p)) return;
  if (M.kindOf(s, node) === 'geodo' && s.crystals[node] > 0 && !p.geodes.includes(node)) {
    s.crystals[node]--; p.crystals++; p.geodes.push(node); p.area += 2;
    log(s, `${p.name} tira um 💠 Cristal do Geodo (💥2)`, 'gain', p.id);
  }
  if (node === BOCA && p.relics.length > 0) {
    p.status = 'out';
    log(s, `${p.name} saiu da mina com ${p.relics.map((r) => RELICS[r].name).join(' e ')}! Selo de Sobrevivente`, 'exit', p.id);
    startWater(s, p.id);
  }
}

// Efeitos de sala ao entrar
function roomEffects(s, p, node) {
  const kind = M.kindOf(s, node);
  const room = ROOMS[kind] || {};
  const first = !p.visited.includes(node);
  if (first) p.visited.push(node);
  p.t.entered ||= [];
  const again = p.t.entered.includes(node);
  p.t.entered.push(node);
  if (room.enter && !again) {
    if (room.enter === 'breathe' && p.folego < MAX_FOLEGO) { heal(p, 1); log(s, `${p.name} respira no Respiro (🫧+1)`, '', p.id); }
    if (room.enter === 'echo') { p.area += 1; log(s, `${p.name} entra na Câmara do Eco (💥1)`, '', p.id); }
    if (room.enter === 'mirror') { p.mirror = true; log(s, `${p.name} pega um caco de espelho no Salão dos Espelhos`, '', p.id); }
    if (room.enter === 'unstone') {
      const i = p.discard.indexOf('PEDR'); const j = p.hand.indexOf('PEDR');
      if (i >= 0) p.discard.splice(i, 1); else if (j >= 0) p.hand.splice(j, 1);
      if (i >= 0 || j >= 0) log(s, `${p.name} quebra um Petrificado na Pedreira`, '', p.id);
    }
  }
  if (room.first && first) {
    if (room.first === 'gold2') { p.gold += 2; log(s, `${p.name} acha ouro no Veio (+🟡2)`, 'gain', p.id); }
    if (room.first === 'pray') s.pending.push({ k: 'trash', pid: p.id, why: 'Capela' });
    if (room.first === 'stash' && s.row.some((x) => isBuyable(x) && CARDS[x].cost <= 4)) s.pending.push({ k: 'gainCheap', pid: p.id, max: 4, why: 'Depósito' });
    if (room.first === 'bone') { p.discard.push('OSSO'); log(s, `${p.name} acha um Osso Gigante no Canil`, 'gain', p.id); }
  }
}
function grisuOptions(s) {
  const ids = M.nodeIds(s).filter((n) => lvOf(s, n) >= 1 && !s.grisu.includes(n));
  const deep = ids.filter((n) => lvOf(s, n) >= 3);
  if (deep.length) return deep;
  const max = Math.max(...ids.map((n) => lvOf(s, n)));
  return ids.filter((n) => lvOf(s, n) === max && n !== '0:1');
}

// ------------------------------------------------------------------ explorar
// Custo para atravessar uma saída que dá para o escuro
export function exploreCost(s, p, dir) {
  if (s.map.mode !== 'explorar') return { err: 'este mapa não se explora' };
  const st = M.stubs(s, p.node).find((x) => x.dir === dir);
  if (!st) return { err: 'não há saída inexplorada desse lado' };
  if (st.pass.type === 'rubble') return { err: 'desabamento: limpe antes (⛏3 ou Dinamite)', st };
  const e = M.stubEdge(p.node, st);
  const c = { luz: 0, prosa: 0, est: 0, den: !!e.den, st, e };
  if (e.type === 't' || e.type === 'rail') c.luz = 1;
  else if (e.type === 'dark') c.luz = p.t.bright || p.t.darkCheap ? 1 : 2;
  else if (e.type === 'shaft') { c.luz = 1; c.est = 2; }
  else if (e.type === 'lad') c.luz = dir === 'D' ? 1 : (p.t.ropeUp ? 1 : 2 + (hasItem(p, 'corda') ? 0 : heavyCount(p)));
  c.deck = M.deckFor(s, st.lv);
  if (!c.deck) return { err: 'não há mais peças de sala' };
  return c;
}

// Nós alcançáveis por trilho (até 3 passos) a partir de node
export function rideTargets(s, node) {
  const out = {};
  const q = [[node, 0]];
  const seen = new Set([node]);
  while (q.length) {
    const [n, d] = q.shift();
    if (d === 3) continue;
    for (const { e, to } of M.neighbors(s, n)) {
      if (e.type !== 'rail' || s.rubble.includes(e.key) || seen.has(to)) continue;
      seen.add(to); out[to] = d + 1; q.push([to, d + 1]);
    }
  }
  return out;
}

// ------------------------------------------------------------------ jogar carta
function playCard(s, p, hi) {
  const id = p.hand[hi];
  if (!id) return 'carta inexistente';
  p.hand.splice(hi, 1);
  p.play.push(id);
  const c = CARDS[id];
  if (c.luz) { p.t.luz += c.luz; if (c.luz >= 2) p.t.bright = true; }
  if (c.prosa) p.t.prosa += c.prosa;
  if (c.pic) p.t.pic += c.pic;
  if (c.est) p.area += c.est;
  if (c.gold) p.gold += c.gold;
  if (c.folego) heal(p, c.folego);
  if (c.draw) draw(s, p, c.draw);
  switch (c.fx) {
    case 'ropeUp': p.t.ropeUp = true; break;
    case 'dyn': p.t.dyn++; break;
    case 'freeRide': p.t.freeRide++; break;
    case 'darkCheap': p.t.darkCheap = true; break;
    case 'detector': if (lvOf(s, p.node) === 4) { p.crystals++; log(s, `${p.name} acha um 💠 com o Detector`, 'gain', p.id); } break;
    case 'gainCheap': if (s.row.some((x) => isBuyable(x) && CARDS[x].cost <= 3)) s.pending.push({ k: 'gainCheap', pid: p.id }); break;
    case 'trash': s.pending.push({ k: 'trash', pid: p.id }); break;
    case 'discard1': if (p.hand.length) s.pending.push({ k: 'discard1', pid: p.id }); break;
    case 'calm': p.t.calm++; break;
    case 'lure': p.t.lure++; break;
    case 'mirror': p.mirror = true; break;
    case 'carveStone': {
      const i = p.hand.indexOf('PEDR'); const j = p.discard.indexOf('PEDR');
      if (i >= 0) p.hand.splice(i, 1); else if (j >= 0) p.discard.splice(j, 1);
      if (i >= 0 || j >= 0) log(s, `${p.name} esculpe e se livra de um Petrificado`, '', p.id);
      break;
    }
    default:
  }
  return null;
}
const isBuyable = (id) => !['beast', 'hazard'].includes(CARDS[id].type);

// ------------------------------------------------------------------ fim do turno
function endTurn(s) {
  const p = currentPlayer(s);
  // cartas que sobraram na mão são jogadas automaticamente
  while (inMine(p) && p.hand.length && !s.pending.length) playCard(s, p, 0);
  if (s.pending.length) { autoResolve(s); }
  const n = Math.max(0, Math.min(p.area, p.cubes));
  if (inMine(p) && n) { p.cubes -= n; s.bag.p[p.id] += n; log(s, `${p.name} põe ${n} cubo(s) na Bateia`, 'clank', p.id); }
  p.area = 0;
  // fim da rodada: a carta mais antiga da Fila sai (o mercado gira)
  if (s.turn === s.order.length - 1 && s.row.length) { const old = s.row.shift(); s.tunnelOut.push(old); log(s, `Fim da rodada: ${CARDS[old].name} sai da Fila`, 'row'); }
  // repõe a Fila
  let quake = false; let grisu = 0;
  while (s.row.length < ROW_SIZE && s.tunnel.length) {
    const id = s.tunnel.pop();
    const c = CARDS[id];
    log(s, `Entra na Fila: ${c.name}${c.quake ? ' 🌋' : ''}`, 'row');
    if (c.quake) quake = true;
    if (c.onEnter === 'grisu') grisu++;
    else if (c.onEnter) onEnter(s, c.onEnter);
    if (c.type === 'hazard') s.tunnelOut.push(id); else s.row.push(id);
  }
  if (!s.tunnel.length && s.water === null) startWater(s, p.id, 'o Túnel acabou');
  s.endStage = { pid: p.id, quake: quake || !!p.t.tookRelic };
  for (let i = 0; i < grisu; i++) s.pending.push({ k: 'grisu', pid: p.id });
  if (!s.pending.length) finishEnd(s);
}

function onEnter(s, k) {
  if (k === 'allLose1') for (const q of s.players) hurt(s, q, 1, 'Corpo-Seco');
  else if (k === 'infiltra') {
    if (s.water !== null) { s.water = Math.max(1, s.water - 1); log(s, `Infiltração! A água sobe para ${LEVELS[s.water]}`, 'water'); if (s.water <= 1) flood(s); }
    else for (const q of s.players) if (inMine(q) && q.cubes) { q.cubes--; s.bag.p[q.id]++; }
  } else if (k === 'wakeHead' && s.cerb) { s.cerb.awake = Math.min(DLCS.cerbero.heads, s.cerb.awake + 1); log(s, `Uivo Triplo: o Cérbero tem ${s.cerb.awake} cabeça(s) acordada(s)`, 'boss'); }
  else if (k === 'gaze' && s.medusa) gaze(s);
}

function finishEnd(s) {
  const st = s.endStage;
  s.endStage = null;
  if (s.over) return;
  if (st.quake) fury(s);
  const p = s.players[st.pid];
  p.discard.push(...p.play, ...p.hand);
  p.play = []; p.hand = [];
  draw(s, p, HAND);
  if (!s.over) nextTurn(s);
}

// ------------------------------------------------------------------ Fúria
export const furyDraws = (s) => FURY_DRAWS[s.fury - 1] + s.furyExtra;
export function fury(s) {
  s.stats.furies++;
  const n = furyDraws(s);
  s.furyExtra = 0;
  const pool = [];
  for (let i = 0; i < s.bag.stone; i++) pool.push(-1);
  s.bag.p.forEach((c, pid) => { for (let i = 0; i < c; i++) pool.push(pid); });
  if (!pool.length) { s.furyExtra = 1; log(s, 'Fúria da Mãe-do-Ouro! A Bateia está vazia: a próxima tira +1', 'fury'); }
  const hits = {};
  for (let i = 0; i < n && pool.length; i++) {
    const j = Math.floor(rnd(s) * pool.length);
    const pid = pool.splice(j, 1)[0];
    if (pid === -1) s.bag.stone--; else { s.bag.p[pid]--; hits[pid] = (hits[pid] || 0) + 1; }
  }
  log(s, `Fúria da Mãe-do-Ouro! Tira ${n}: ${Object.entries(hits).map(([pid, k]) => `${s.players[pid].name}×${k}`).join(', ') || 'só pedras'}`, 'fury');
  for (const [pid, k] of Object.entries(hits)) { s.stats.cubesHit += k; hurt(s, s.players[pid], k, 'Fúria'); }
  if (s.cerb) cerbFury(s);
  if (s.medusa) medusaFury(s);
}

// ------------------------------------------------------------------ DLC Cérbero
function cerbTarget(s) {
  const d = bfsDist(s, s.cerb.node);
  const alive = s.players.filter(inMine);
  const pick = (list) => list.filter((q) => d[q.node] !== undefined).sort((a, b) => d[a.node] - d[b.node] || a.id - b.id)[0];
  return pick(alive.filter((q) => q.relics.length)) || pick(alive.filter((q) => lvOf(s, q.node) >= 2)) || null;
}
function cerbStep(s, toward) {
  const d = bfsDist(s, toward);
  const opts = monsterAdj(s, s.cerb.node).filter((m) => d[m] !== undefined).sort((a, b) => d[a] - d[b] || (a < b ? -1 : 1));
  if (opts.length && d[opts[0]] < (d[s.cerb.node] ?? Infinity)) s.cerb.node = opts[0];
}
function cerbFury(s) {
  s.cerb.awake = Math.min(DLCS.cerbero.heads, s.cerb.awake + 1);
  const bitten = new Set();
  for (let i = 0; i < s.cerb.awake; i++) {
    const t = cerbTarget(s);
    if (!t || t.node === s.cerb.node) break;
    cerbStep(s, t.node);
    for (const q of s.players) if (inMine(q) && q.node === s.cerb.node && !bitten.has(q.id)) { bitten.add(q.id); s.stats.bites++; hurt(s, q, DLCS.cerbero.biteDmg, 'mordida do Cérbero'); }
  }
  for (const q of s.players) if (inMine(q) && q.node === s.cerb.node && !bitten.has(q.id)) { s.stats.bites++; hurt(s, q, DLCS.cerbero.biteDmg, 'mordida do Cérbero'); }
  log(s, `O Cérbero (${s.cerb.awake} cabeça(s) acordada(s)) está em ${s.cerb.node}`, 'boss');
}
const nearCerb = (s, p) => s.cerb && (p.node === s.cerb.node || monsterAdj(s, p.node).includes(s.cerb.node));

// ------------------------------------------------------------------ DLC Medusa
// Ela anda pelas fendas: sobe ou desce UM nível por Fúria, na direção do nível com mais garimpeiros
// (empate: o mais fundo), parando no nó desse nível mais perto de onde estava. Depois, olha.
function medusaFury(s) {
  const cnt = {};
  for (const q of s.players) if (inMine(q) && lvOf(s, q.node) >= 1) cnt[lvOf(s, q.node)] = (cnt[lvOf(s, q.node)] || 0) + 1;
  const lvls = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a] || b - a);
  const cur = lvOf(s, s.medusa.node);
  if (lvls.length && lvls[0] !== cur) {
    const lv = cur + Math.sign(lvls[0] - cur);
    const x = M.nodeOf(s, s.medusa.node).x;
    const opts = M.nodeIds(s).filter((n) => lvOf(s, n) === lv).sort((a, b) => Math.abs(M.nodeOf(s, a).x - x) - Math.abs(M.nodeOf(s, b).x - x) || (a < b ? -1 : 1));
    if (opts.length) s.medusa.node = opts[0];
  }
  gaze(s);
}
export const MEDUSA_RANGE = 3;
// Linha de visão: até 3 nós pelos túneis do mesmo nível, sem atravessar desabamento nem túnel escuro.
export function medusaSees(s) {
  const lv = lvOf(s, s.medusa.node);
  const seen = new Map([[s.medusa.node, 0]]);
  const q = [s.medusa.node];
  while (q.length) {
    const n = q.shift();
    if (seen.get(n) >= MEDUSA_RANGE) continue;
    for (const { e, to } of M.neighbors(s, n)) {
      if (lvOf(s, to) !== lv || seen.has(to) || e.type === 'dark' || s.rubble.includes(e.key)) continue;
      seen.set(to, seen.get(n) + 1); q.push(to);
    }
  }
  return seen;
}
function gaze(s) {
  s.stats.gazes++;
  const vis = medusaSees(s);
  log(s, `A Medusa olha a ${LEVELS[lvOf(s, s.medusa.node)]} a partir de ${s.medusa.node}`, 'boss');
  for (const q of s.players) {
    if (!inMine(q) || !vis.has(q.node)) continue;
    if (q.mirror) { q.mirror = false; log(s, `${q.name} reflete o olhar com o espelho`, '', q.id); continue; }
    q.discard.push('PEDR');
    log(s, `${q.name} fica parcialmente petrificado (+1 carta Petrificado)`, 'dmg', q.id);
    if (q.node === s.medusa.node) hurt(s, q, 1, 'olhar da Medusa de perto');
  }
}
const nearMedusa = (s, p) => s.medusa && (p.node === s.medusa.node || monsterAdj(s, p.node).includes(s.medusa.node));

// Compra a peça do monte; peças com nível mínimo maior voltam para o fundo
function drawTile(s, deck, lv) {
  const d = s.map.decks[deck];
  for (let i = 0; i < d.length; i++) {
    const t = d.shift();
    const min = TILE_MIN_LEVEL[t.split(' ')[0]] || 0;
    if (lv >= min) return t;
    d.push(t);
  }
  return d.shift();
}
// ------------------------------------------------------------------ colocar a peça descoberta
function placeExplored(s, p, pd, mirror) {
  const node = M.placeTile(s, pd.cell, pd.tile, mirror, pd.enterSide, pd.pass);
  s.stats.tiles++;
  log(s, `${p.name} descobre ${ROOMS[node.kind]?.name || node.kind} (${pd.cell})`, 'tile', p.id);
  onReveal(s, pd.cell);
  if (pd.den) { if (p.t.pic >= 1) p.t.pic -= 1; else hurt(s, p, 1, 'Toca de Bicho'); }
  if (inMine(p)) arrive(s, p, pd.cell);
}
// Escolha padrão de lado: o que abre mais saídas para células vazias, preferindo descer
function bestMirror(s, pd) {
  const score = (mirror) => {
    let t = M.parseTileFor(pd.tile, mirror);
    const [col, lv] = pd.cell.split(':').map(Number);
    let v = 0;
    for (const [side, ex] of Object.entries(t.exits)) {
      const [dc, dl] = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] }[side];
      if (s.map.nodes[`${col + dc}:${lv + dl}`]) continue;
      v += side === 'D' ? 2 : 1;
      if (ex.type === 'rubble') v -= 1;
      if (Math.abs(col + dc) < Math.abs(col)) v += 0.5;
    }
    return v;
  };
  return score(true) > score(false);
}

// ------------------------------------------------------------------ escolhas pendentes
function resolvePending(s, a) {
  const pd = s.pending[0];
  const p = s.players[pd.pid];
  if (pd.k === 'place') {
    s.pending.shift();
    placeExplored(s, p, pd, !!a.mirror);
    return null;
  }
  if (pd.k === 'gainCheap') {
    if (a.skip) { s.pending.shift(); return null; }
    const id = s.row[a.i];
    const max = pd.max || 3;
    if (!id || !isBuyable(id) || CARDS[id].cost > max) return `escolha uma carta de custo até ${max} da Fila`;
    s.row.splice(a.i, 1); gain(s, p, id); log(s, `${p.name} ganha ${CARDS[id].name}`, 'buy', p.id);
  } else if (pd.k === 'trash') {
    if (a.skip) { s.pending.shift(); return null; }
    const arr = a.from === 'discard' ? p.discard : a.from === 'play' ? p.play : p.hand;
    if (!arr[a.i]) return 'carta inexistente';
    const [id] = arr.splice(a.i, 1);
    log(s, `${p.name} destrói ${CARDS[id].name}`, '', p.id);
  } else if (pd.k === 'discard1') {
    if (!p.hand[a.i]) return 'escolha uma carta da mão';
    p.play.push(...p.hand.splice(a.i, 1));
  } else if (pd.k === 'grisu') {
    if (a.skip && !grisuOptions(s).length) { s.pending.shift(); log(s, 'O Grisu se dissipa: não há sala funda para ele', ''); return null; }
    if (!grisuOptions(s).includes(a.node)) return 'Grisu vai numa sala da Galeria 3 ou mais funda (ou na mais funda que existir), sem Grisu';
    s.grisu.push(a.node); log(s, `${p.name} põe Grisu em ${a.node}`, '', p.id);
  }
  s.pending.shift();
  return null;
}
// Resolve o pendente com a escolha padrão (usado no fim do turno e pelo bot simples)
export function defaultChoice(s, pd = s.pending[0]) {
  const p = s.players[pd.pid];
  const val = (id) => (CARDS[id].cost || 0) + (CARDS[id].pts || 0);
  if (pd.k === 'place') return { t: 'choose', mirror: bestMirror(s, pd) };
  if (pd.k === 'gainCheap') {
    const i = s.row.map((id, k) => [id, k]).filter(([id]) => isBuyable(id) && CARDS[id].cost <= (pd.max || 3)).sort((a, b) => val(b[0]) - val(a[0]))[0];
    return i ? { t: 'choose', i: i[1] } : { t: 'choose', skip: true };
  }
  if (pd.k === 'trash') {
    const pref = ['PEDR', 'TROP', 'LAMP', 'BARG'];
    for (const id of pref) {
      for (const from of ['hand', 'play', 'discard']) {
        const i = p[from].indexOf(id);
        if (i >= 0 && !(id === 'BARG' && allCards(p).filter((x) => x === 'BARG').length <= 3)) return { t: 'choose', from, i };
      }
    }
    return { t: 'choose', skip: true };
  }
  if (pd.k === 'discard1') {
    let best = 0;
    p.hand.forEach((id, i) => { if (val(id) < val(p.hand[best])) best = i; });
    return { t: 'choose', i: best };
  }
  if (pd.k === 'grisu') {
    // longe de quem escolhe, perto dos rivais mais fundos
    const opts = grisuOptions(s);
    if (!opts.length) return { t: 'choose', skip: true };
    const rivals = s.players.filter((q) => q.id !== p.id && inMine(q));
    const score = (n) => rivals.reduce((a, q) => a + (q.node === n ? 3 : 0) + (lvOf(s, q.node) === lvOf(s, n) ? 1 : 0), 0) - (lvOf(s, p.node) === lvOf(s, n) ? 2 : 0);
    opts.sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1));
    return { t: 'choose', node: opts[0] };
  }
  return { t: 'choose', skip: true };
}
function autoResolve(s) {
  for (let g = 0; g < 20 && s.pending.length; g++) resolvePending(s, defaultChoice(s));
}

// ------------------------------------------------------------------ ações
// Ações: play {hi} · playAll · move {to} · ride {to} · buy {src:'row',i | src:'fixed',id} · fight {src:'row',i | src:'fixed'}
// clear {edge | node} · take · mascate {item} · rest · calm · fightCerb · fightMedusa · end · choose {...}
export function exec(s, a, pid = null) {
  if (s.over) return 'jogo acabou';
  if (s.pending.length) {
    const pd = s.pending[0];
    if (pid !== null && pid !== pd.pid) return 'aguardando outro jogador';
    if (a.t !== 'choose') return 'resolva a escolha pendente';
    const err = resolvePending(s, a);
    if (!err && !s.pending.length && s.endStage) finishEnd(s);
    return err;
  }
  const p = currentPlayer(s);
  if (pid !== null && pid !== p.id) return 'não é sua vez';
  const err = act(s, p, a);
  if (err) return err;
  // morreu ou saiu no meio do turno: o turno acaba
  if (!s.over && !inMine(p) && !s.endStage) endTurn(s);
  return null;
}

function act(s, p, a) {
  const t = p.t;
  switch (a.t) {
    case 'play': return playCard(s, p, a.hi);
    case 'playAll': { while (p.hand.length && !s.pending.length) playCard(s, p, 0); return null; }
    case 'move': {
      const c = moveCost(s, p, p.node, a.to);
      if (c.err) return c.err;
      if (t.luz < c.luz) return `precisa de 🔦${c.luz}`;
      if (t.prosa < c.prosa) return `precisa de 🤝${c.prosa}`;
      t.luz -= c.luz; t.prosa -= c.prosa; p.area += c.est;
      if (c.den) { if (t.pic >= 1) t.pic -= 1; else hurt(s, p, 1, 'Toca de Bicho'); }
      if (!inMine(p)) return null;
      arrive(s, p, a.to);
      return null;
    }
    case 'explore': {
      const c = exploreCost(s, p, a.dir);
      if (c.err) return c.err;
      if (t.luz < c.luz) return `precisa de 🔦${c.luz}`;
      t.luz -= c.luz; p.area += c.est;
      const tile = drawTile(s, c.deck, c.st.lv);
      const pass = { type: c.e.type, ...(c.den ? { den: true } : {}) };
      s.pending.push({ k: 'place', pid: p.id, cell: c.st.cell, tile, enterSide: M.OPP[a.dir], pass, den: c.den });
      return null;
    }
    case 'ride': {
      const tg = rideTargets(s, p.node);
      if (!tg[a.to]) return 'fora do alcance do trilho';
      if (t.freeRide > 0) t.freeRide--;
      else { if (t.luz < 1) return 'precisa de 🔦1'; t.luz -= 1; p.area += 2; }
      arrive(s, p, a.to);
      return null;
    }
    case 'buy': {
      if (a.src === 'fixed') {
        const id = a.id;
        if (!FIXED.includes(id)) return 'carta fixa inexistente';
        if (s.fixedQty[id] <= 0) return 'pilha vazia';
        if (t.prosa < CARDS[id].cost) return `precisa de 🤝${CARDS[id].cost}`;
        t.prosa -= CARDS[id].cost; s.fixedQty[id]--; gain(s, p, id);
        log(s, `${p.name} compra ${CARDS[id].name}`, 'buy', p.id);
        return null;
      }
      const id = s.row[a.i];
      if (!id) return 'carta inexistente';
      if (!isBuyable(id)) return 'Bichos se derrotam com ⛏';
      if (t.prosa < CARDS[id].cost) return `precisa de 🤝${CARDS[id].cost}`;
      t.prosa -= CARDS[id].cost; s.row.splice(a.i, 1); gain(s, p, id);
      log(s, `${p.name} compra ${CARDS[id].name}`, 'buy', p.id);
      return null;
    }
    case 'fight': {
      const id = a.src === 'fixed' ? FIXED_BEAST : s.row[a.i];
      const c = id && CARDS[id];
      if (!c || c.type !== 'beast') return 'não é um Bicho';
      if (t.pic < c.fight) return `precisa de ⛏${c.fight}`;
      t.pic -= c.fight;
      if (a.src !== 'fixed') { s.row.splice(a.i, 1); s.tunnelOut.push(id); }
      reward(s, p, c.reward);
      log(s, `${p.name} derrota ${c.name}`, 'fight', p.id);
      return null;
    }
    case 'clear': {
      if (a.dir) {
        const st = M.stubs(s, p.node).find((x) => x.dir === a.dir);
        if (!st || st.pass.type !== 'rubble') return 'não há desabamento desse lado';
        if (t.dyn > 0) t.dyn--; else if (t.pic >= 3) t.pic -= 3; else return 'precisa de ⛏3 ou Dinamite';
        s.map.nodes[p.node].exits[a.dir] = { type: ['U', 'D'].includes(a.dir) ? 'lad' : 't' };
        log(s, `${p.name} limpa o desabamento`, '', p.id);
        return null;
      }
      if (a.edge) {
        if (!s.rubble.includes(a.edge)) return 'não há desabamento aí';
        const e = s.map.edges.find((x) => x.key === a.edge);
        if (e.a !== p.node && e.b !== p.node) return 'precisa estar numa ponta do desabamento';
        if (t.dyn > 0) t.dyn--; else if (t.pic >= 3) t.pic -= 3; else return 'precisa de ⛏3 ou Dinamite';
        s.rubble = s.rubble.filter((k) => k !== a.edge);
        log(s, `${p.name} limpa o desabamento ${a.edge}`, '', p.id);
        return null;
      }
      if (!s.grisu.includes(a.node)) return 'não há Grisu aí';
      if (a.node !== p.node && !M.neighbors(s, p.node).some((x) => x.to === a.node)) return 'precisa estar no nó ou ao lado';
      if (t.pic < 2) return 'precisa de ⛏2';
      t.pic -= 2; s.grisu = s.grisu.filter((n) => n !== a.node);
      log(s, `${p.name} ventila o Grisu em ${a.node}`, '', p.id);
      return null;
    }
    case 'take': {
      const r = s.relics[p.node];
      if (!r) return 'não há Relíquia aqui';
      if (p.relics.length >= relicCap(p)) return 'você não aguenta carregar mais';
      delete s.relics[p.node]; p.relics.push(r); t.tookRelic = true;
      s.fury = Math.min(FURY_DRAWS.length, s.fury + (RELICS[r].fury || 1));
      log(s, `${p.name} pega ${RELICS[r].name} (✦${RELICS[r].pts}). A Fúria sobe para ${s.fury}`, 'relic', p.id);
      return null;
    }
    case 'mascate': {
      const m = MASCATE[a.item];
      if (M.kindOf(s, p.node) !== 'mascate') return 'você precisa estar na sala do Mascate';
      if (!m || s.mascate[a.item] <= 0) return 'item esgotado';
      if (t.mascate) return 'uma compra no Mascate por turno';
      if (p.gold < m.gold) return `precisa de 🟡${m.gold}`;
      if (a.item !== 'cantil' && hasItem(p, a.item)) return 'você já tem esse item';
      p.gold -= m.gold; s.mascate[a.item]--; t.mascate = true;
      if (m.folego) heal(p, m.folego); else p.items.push(a.item);
      log(s, `${p.name} compra ${m.name} no Mascate`, 'buy', p.id);
      return null;
    }
    case 'rest': {
      if (p.node !== BARRACAO_NODE) return 'o Barracão fica na Superfície';
      if (t.rest) return 'uma vez por turno';
      if (t.prosa < 2) return 'precisa de 🤝2';
      t.prosa -= 2; t.rest = true; heal(p, 1);
      return null;
    }
    case 'calm': {
      if (!s.cerb) return 'sem Cérbero';
      if (s.cerb.awake <= 0) return 'todas as cabeças já dormem';
      if (t.calm > 0) t.calm--; else if (t.prosa >= DLCS.cerbero.calmCost) t.prosa -= DLCS.cerbero.calmCost; else return `precisa de 🤝${DLCS.cerbero.calmCost} ou uma carta que acalma`;
      s.cerb.awake--;
      log(s, `${p.name} acalma uma cabeça do Cérbero (${s.cerb.awake} acordada(s))`, 'boss', p.id);
      return null;
    }
    case 'lure': {
      if (!s.cerb || t.lure <= 0) return 'precisa do Osso Gigante';
      t.lure--;
      for (let i = 0; i < 2; i++) cerbStep(s, s.cerb.lair);
      log(s, `${p.name} joga o osso: o Cérbero recua para ${s.cerb.node}`, 'boss', p.id);
      return null;
    }
    case 'fightCerb': {
      if (!s.cerb || !nearCerb(s, p)) return 'o Cérbero precisa estar no seu nó ou ao lado';
      const cost = DLCS.cerbero.fightCost;
      if (t.pic < cost) return `precisa de ⛏${cost}`;
      t.pic -= cost; s.cerb = { node: s.cerb.lair, lair: s.cerb.lair, awake: 0 };
      reward(s, p, DLCS.cerbero.fightReward);
      log(s, `${p.name} enfrenta o Cérbero e o manda de volta ao Covil!`, 'boss', p.id);
      return null;
    }
    case 'fightMedusa': {
      if (!s.medusa || !nearMedusa(s, p)) return 'a Medusa precisa estar no seu nó ou ao lado';
      const cost = DLCS.medusa.fightCost;
      if (t.pic < cost) return `precisa de ⛏${cost}`;
      t.pic -= cost; s.medusa.node = M.findKind(s, 'ninho') || s.medusa.lair;
      reward(s, p, DLCS.medusa.fightReward);
      log(s, `${p.name} afasta a Medusa de volta para o fundo!`, 'boss', p.id);
      return null;
    }
    case 'end': endTurn(s); return null;
    default: return 'ação desconhecida';
  }
}

function reward(s, p, r = {}) {
  if (r.gold) p.gold += r.gold;
  if (r.luz) p.t.luz += r.luz;
  if (r.draw) draw(s, p, r.draw);
  if (r.crystal) p.crystals += r.crystal;
  if (r.est) p.area += r.est;
  if (r.trophy) p.discard.push(r.trophy);
}
