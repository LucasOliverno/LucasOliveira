// GARIMPO — mapa da partida.
// 'explorar' (padrão): a mina é descoberta durante o jogo, colocando peças de Sala numa grade em corte.
// 'classico': o mapa fixo de 32 nós (tutorial e testes).
// O mapa fica no estado (s.map) e é JSON puro. A adjacência é recalculada sob demanda e guardada num cache.
import {
  NODES, EDGES, START_RUBBLE, edgeKey, ROOMS, GRID, TILE_DECKS, DECK_OF_LEVEL, NINHO_TILE, NINHO_WITHIN, ENTRY_TILE,
  DLC_TILES, parseTile, RELIC_TIERS, DLC_RELIC_TIER, RELICS, CRYSTALS_PER_GEODE,
} from './data.js';

// ------------------------------------------------------------------ grafo
const CACHE = new WeakMap();
export function adj(s) {
  let A = CACHE.get(s.map);
  if (A && A.n === s.map.edges.length) return A.adj;
  const out = {};
  for (const id of Object.keys(s.map.nodes)) out[id] = [];
  for (const e of s.map.edges) {
    out[e.a].push({ e, to: e.b });
    if (e.type !== 'shaft') out[e.b].push({ e, to: e.a });
  }
  CACHE.set(s.map, { n: s.map.edges.length, adj: out });
  return out;
}
export const nodeIds = (s) => Object.keys(s.map.nodes);
export const nodeOf = (s, id) => s.map.nodes[id];
export const lvOf = (s, id) => s.map.nodes[id].lv;
export const kindOf = (s, id) => s.map.nodes[id].kind || 'vazia';
export const neighbors = (s, id) => adj(s)[id];
export const edgeBetween = (s, a, b) => adj(s)[a].find((x) => x.to === b)?.e || null;
export const findKind = (s, kind) => nodeIds(s).find((n) => s.map.nodes[n].kind === kind) || null;
export const roomName = (s, id) => ROOMS[kindOf(s, id)]?.name || kindOf(s, id);

// ------------------------------------------------------------------ mapa clássico (tutorial e testes)
export function classicMap() {
  const nodes = {};
  for (const [id, n] of Object.entries(NODES)) nodes[id] = { lv: n.lv, x: n.x, kind: n.kind || 'vazia', ...(n.relic ? { relic: n.relic } : {}) };
  const edges = EDGES.map((e) => ({ a: e.a, b: e.b, type: e.type, ...(e.den ? { den: true } : {}), key: edgeKey(e.a, e.b) }));
  return { mode: 'classico', nodes, edges, rubble: [...START_RUBBLE] };
}

// ------------------------------------------------------------------ exploração
export const cellId = (col, lv) => `${col}:${lv}`;
const SIDE = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
export const OPP = { L: 'R', R: 'L', U: 'D', D: 'U' };
const inGrid = (col, lv) => col >= GRID.minCol && col <= GRID.maxCol && lv >= 1 && lv <= GRID.levels;
const VERT = (side) => side === 'U' || side === 'D';

function shuf(rnd, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function exploreMap(rnd, dlc = []) {
  const decks = Object.fromEntries(Object.entries(TILE_DECKS).map(([k, list]) => [k, [...list]]));
  for (const k of dlc) for (const [d, list] of Object.entries(DLC_TILES[k] || {})) decks[d].push(...list);
  for (const k of Object.keys(decks)) decks[k] = shuf(rnd, decks[k]);
  decks.funda.splice(Math.floor(rnd() * NINHO_WITHIN), 0, NINHO_TILE);
  // pilhas de Relíquia (do menor para o maior), com as Relíquias das DLCs
  const piles = Object.fromEntries(Object.entries(RELIC_TIERS).map(([k, l]) => [k, [...l]]));
  for (const [r, tier] of Object.entries(DLC_RELIC_TIER)) if (dlc.includes(RELICS[r].dlc)) piles[tier].push(r);
  for (const k of Object.keys(piles)) piles[k].sort((a, b) => RELICS[a].pts - RELICS[b].pts);
  const map = {
    mode: 'explorar', decks, piles, rubble: [],
    nodes: {
      S1: { lv: 0, x: 0, kind: 'boca' },
      S2: { lv: 0, x: 1, kind: 'barracao' },
    },
    edges: [{ a: 'S1', b: 'S2', type: 't', key: edgeKey('S1', 'S2') }],
  };
  const entry = parseTile(ENTRY_TILE);
  const id = cellId(0, 1);
  map.nodes[id] = { lv: 1, x: 0, col: 0, kind: entry.kind, exits: entry.exits };
  map.edges.push({ a: 'S1', b: id, type: 'lad', key: edgeKey('S1', id) });
  return map;
}

// Saídas de um nó que dão para uma célula ainda vazia (dá para explorar por elas)
export function stubs(s, node) {
  const n = s.map.nodes[node];
  if (!n?.exits) return [];
  const out = [];
  for (const [side, ex] of Object.entries(n.exits)) {
    const [dc, dl] = SIDE[side];
    const col = n.col + dc; const lv = n.lv + dl;
    if (!inGrid(col, lv) || s.map.nodes[cellId(col, lv)]) continue;
    if (side === 'U' && ex.type === 'shaft') continue;
    out.push({ dir: side, cell: cellId(col, lv), col, lv, pass: ex });
  }
  return out;
}

// Passagem "virtual" de um nó até a célula vazia, no formato de aresta (a = de cima nas verticais)
export function stubEdge(node, st) {
  const t = st.pass.type === 'rubble' ? (VERT(st.dir) ? 'lad' : 't') : st.pass.type;
  const [a, b] = st.dir === 'U' ? [st.cell, node] : [node, st.cell];
  return { a, b, type: t, ...(st.pass.den ? { den: true } : {}), rubble: st.pass.type === 'rubble', key: edgeKey(node, st.cell) };
}

// Profundidade do monte para um nível. Monte vazio: tenta o mais fundo, depois o mais raso.
export function deckFor(s, lv) {
  const order = { rasa: ['rasa', 'media', 'funda'], media: ['media', 'funda', 'rasa'], funda: ['funda', 'media', 'rasa'] }[DECK_OF_LEVEL[lv]];
  return order.find((k) => s.map.decks[k].length) || null;
}

export function mirrorTile(tile) {
  const ex = { ...tile.exits };
  [ex.L, ex.R] = [tile.exits.R, tile.exits.L];
  for (const k of Object.keys(ex)) if (!ex[k]) delete ex[k];
  return { ...tile, exits: ex };
}

// Coloca a peça na célula. enterSide = lado da peça por onde o explorador chega; enterPass = tipo da passagem usada.
export function placeTile(s, cell, tileStr, mirror, enterSide, enterPass) {
  let tile = parseTile(tileStr);
  if (mirror) tile = mirrorTile(tile);
  const [col, lv] = cell.split(':').map(Number);
  const exits = { ...tile.exits };
  if (!exits[enterSide] || exits[enterSide].type === 'rubble') exits[enterSide] = { ...enterPass, type: enterPass.type === 'rubble' ? (VERT(enterSide) ? 'lad' : 't') : enterPass.type };
  s.map.nodes[cell] = { lv, x: col, col, kind: tile.kind, exits };
  // liga com todas as vizinhas já colocadas: existe passagem se qualquer uma das duas tiver saída para a outra
  for (const [side, [dc, dl]] of Object.entries(SIDE)) {
    const nb = cellId(col + dc, lv + dl);
    const other = s.map.nodes[nb];
    if (!other?.exits) continue;
    const mine = exits[side]; const theirs = other.exits[OPP[side]];
    const pass = theirs || mine;
    if (!pass) continue;
    if (!theirs) other.exits[OPP[side]] = { ...pass };
    if (!mine) exits[side] = { ...pass };
    const vert = VERT(side);
    const upper = side === 'U' ? nb : cell; const lower = side === 'U' ? cell : nb;
    let type = pass.type;
    if (type === 'rubble') type = vert ? 'lad' : 't';
    if (vert && type !== 'shaft') type = 'lad';
    if (vert && type === 'shaft' && s.map.nodes[upper].exits.D?.type !== 'shaft') type = 'lad';
    const e = vert ? { a: upper, b: lower, type } : { a: side === 'L' ? nb : cell, b: side === 'L' ? cell : nb, type };
    if (pass.den) e.den = true;
    e.key = edgeKey(e.a, e.b);
    if (s.map.edges.some((x) => x.key === e.key)) continue;
    s.map.edges.push(e);
    if (pass.type === 'rubble' && !(nb === enterFrom(s, cell, enterSide))) s.rubble.push(e.key);
  }
  if (tile.kind === 'elevador') s.map.edges.push({ a: 'S1', b: cell, type: 'elev', key: edgeKey('S1', cell) });
  CACHE.delete(s.map);
  return s.map.nodes[cell];
}
function enterFrom(s, cell, enterSide) {
  const [col, lv] = cell.split(':').map(Number);
  const [dc, dl] = SIDE[enterSide];
  return cellId(col + dc, lv + dl);
}

// Todos os nós alcançáveis a partir de um nó, respeitando desabamentos e o sentido dos poços
export function reachable(s, from = 'S1') {
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const n = q.shift();
    for (const { e, to } of adj(s)[n]) if (!s.rubble.includes(e.key) && !seen.has(to)) { seen.add(to); q.push(to); }
  }
  return seen;
}

export const crystalsFor = () => CRYSTALS_PER_GEODE;
export const parseTileFor = (str, mirror) => (mirror ? mirrorTile(parseTile(str)) : parseTile(str));
