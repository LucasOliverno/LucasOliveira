// GARIMPO — mapa da partida.
// 'explorar' (padrão): a mina é descoberta durante o jogo, colocando peças de Sala numa grade em corte.
// 'classico': o mapa fixo de 32 nós (tutorial e testes).
// O mapa fica no estado (s.map) e é JSON puro. A adjacência é recalculada sob demanda e guardada num cache.
import {
  NODES, EDGES, START_RUBBLE, edgeKey, ROOMS, TILE_LAYOUTS, START_TILE, TILES, NINHO_TILE, SAFE_TILES_USED, DEEP_FROM, DEEP_TO,
  DLC_TILES, MAX_TILE_DIST, RELIC_TIERS, DLC_RELIC_TIER, RELICS, CRYSTALS_PER_GEODE,
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
    if (e.type !== 'shaft' && e.type !== 'ramp') out[e.b].push({ e, to: e.a });
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
  return { mode: 'classico', nodes, edges, rubble: [...START_RUBBLE], boca: 'S1' };
}

// ------------------------------------------------------------------ exploração por peças
export const SIDES = ['N', 'E', 'S', 'W'];
export const OPP = { N: 'S', S: 'N', E: 'W', W: 'E', L: 'R', R: 'L', U: 'D', D: 'U' };
const STEP = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export const tileKey = (tx, ty) => `${tx},${ty}`;
export const tileDist = (tx, ty) => Math.abs(tx) + Math.abs(ty);
const roomId = (tx, ty, i) => `${tx},${ty}.${i}`;

function shuf(rnd, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Gira a peça r vezes 90° no sentido horário
export function buildTile(spec, rot = 0) {
  const L = TILE_LAYOUTS[spec.lay];
  let rooms = L.rooms.map(([cx, cy], i) => ({ kind: spec.k[i], cx, cy }));
  let edge = {};
  for (const [side, room] of Object.entries(L.edge)) if (spec.e[side]) edge[side] = { room, type: spec.e[side] };
  for (let k = 0; k < rot; k++) {
    rooms = rooms.map((r) => ({ ...r, cx: 2 - r.cy, cy: r.cx }));
    const ne = {};
    for (const [side, v] of Object.entries(edge)) ne[SIDES[(SIDES.indexOf(side) + 1) % 4]] = v;
    edge = ne;
  }
  const tun = L.tun.map(([i, j], k) => [i, j, spec.t[k] || 't']);
  return { rooms, tun, edge };
}
export const rotationsFor = (spec, enterSide) => [0, 1, 2, 3].filter((r) => buildTile(spec, r).edge[enterSide]);

function passOf(code) {
  if (code === 'den') return { type: 't', den: true };
  if (code === 'dden') return { type: 'dark', den: true };
  if (code === 'rub') return { type: 't', rubble: true };
  return { type: code };
}

export function exploreMap(rnd, dlc = []) {
  const safe = shuf(rnd, TILES.segura).slice(0, SAFE_TILES_USED).map((t) => ({ ...t, zone: 'segura' }));
  let deep = [...TILES.fundo];
  const special = [{ ...NINHO_TILE }];
  for (const k of dlc) { const d = DLC_TILES[k]; if (!d) continue; deep.push(...d.extra); special.push(...d.lair); }
  deep = shuf(rnd, deep).map((t) => ({ ...t, zone: 'fundo' }));
  for (const t of special) deep.splice(DEEP_FROM + Math.floor(rnd() * (Math.min(DEEP_TO, deep.length) - DEEP_FROM + 1)), 0, { ...t, zone: 'fundo' });
  const piles = Object.fromEntries(Object.entries(RELIC_TIERS).map(([k, l]) => [k, [...l]]));
  for (const [r, tier] of Object.entries(DLC_RELIC_TIER)) if (dlc.includes(RELICS[r].dlc)) piles[tier].push(r);
  for (const k of Object.keys(piles)) piles[k].sort((a, b) => RELICS[a].pts - RELICS[b].pts);
  const map = { mode: 'explorar', stack: [...safe, ...deep], piles, rubble: [], nodes: {}, edges: [], tiles: {}, boca: roomId(0, 0, 0) };
  addTile(map, 0, 0, { ...START_TILE, zone: 'segura' }, 0, null, null);
  return map;
}

// Coloca a peça na grade. enter: lado da peça por onde o explorador entra; pass: passagem usada
export function addTile(map, tx, ty, spec, rot, enter, pass) {
  const b = buildTile(spec, rot);
  const d = tileDist(tx, ty);
  const ids = b.rooms.map((r, i) => {
    const id = roomId(tx, ty, i);
    map.nodes[id] = { lv: d, x: tx * 3 + r.cx, y: ty * 3 + r.cy, tile: tileKey(tx, ty), kind: r.kind, zone: spec.zone };
    return id;
  });
  const push = (a, bb, ps) => {
    const e = { a, b: bb, type: ps.type === 'ramp' ? 'ramp' : ps.type, key: edgeKey(a, bb) };
    if (ps.den) e.den = true;
    if (map.edges.some((x) => x.key === e.key)) return;
    map.edges.push(e);
    if (ps.rubble) map.rubble.push(e.key);
  };
  for (const [i, j, code] of b.tun) push(ids[i], ids[j], passOf(code));
  const tile = { zone: spec.zone, rot, edges: {} };
  for (const [side, v] of Object.entries(b.edge)) tile.edges[side] = { node: ids[v.room], ...passOf(v.type) };
  map.tiles[tileKey(tx, ty)] = tile;
  // liga às vizinhas: só onde as duas peças têm saída na borda em comum
  for (const side of SIDES) {
    const mine = tile.edges[side];
    const [dx, dy] = STEP[side];
    const nb = map.tiles[tileKey(tx + dx, ty + dy)];
    const theirs = nb?.edges[OPP[side]];
    if (!mine || !theirs) continue;
    let ps;
    if (side === enter) ps = { ...pass, rubble: false };
    else ps = { type: theirs.type === 'ramp' ? 't' : theirs.type, den: !!(theirs.den || mine.den), rubble: !!(theirs.rubble || mine.rubble) };
    push(theirs.node, mine.node, ps);
  }
  if (b.rooms.some((r) => r.kind === 'elevador')) {
    const el = ids[b.rooms.findIndex((r) => r.kind === 'elevador')];
    map.edges.push({ a: map.boca, b: el, type: 'elev', key: edgeKey(map.boca, el) });
  }
  return ids;
}

// Saídas de um nó que dão para uma casa vazia da grade (dá para explorar por elas)
export function stubs(s, node) {
  const n = s.map.nodes[node];
  if (!n?.tile || !s.map.tiles) return [];
  const [tx, ty] = n.tile.split(',').map(Number);
  const t = s.map.tiles[n.tile];
  const out = [];
  for (const [side, ex] of Object.entries(t.edges)) {
    if (ex.node !== node) continue;
    const [dx, dy] = STEP[side];
    const nx = tx + dx; const ny = ty + dy;
    if (tileDist(nx, ny) > MAX_TILE_DIST || s.map.tiles[tileKey(nx, ny)]) continue;
    out.push({ dir: side, cell: tileKey(nx, ny), tx: nx, ty: ny, lv: tileDist(nx, ny), pass: { type: ex.rubble ? 'rubble' : ex.type, ...(ex.den ? { den: true } : {}) } });
  }
  return out;
}

// Passagem "virtual" de um nó até a casa vazia, no formato de aresta
export function stubEdge(node, st) {
  return { a: node, b: st.cell, type: st.pass.type === 'rubble' ? 't' : st.pass.type, ...(st.pass.den ? { den: true } : {}), key: `${node}>${st.cell}` };
}
export const zoneOf = (s, id) => s.map.nodes[id]?.zone || (s.map.nodes[id]?.lv <= 1 ? 'segura' : 'fundo');

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

