// Sprites isométricos gerados por MANDATO/3d/build_sprites.py (public/mandato/iso/<ID>.webp).
// Enquadramento comum: o losango da casa ocupa ISO_DIAMOND da largura do sprite e o centro da casa fica em
// (50%, ISO_ANCHOR_Y). Sprite = 320×480 → altura = 1,5 × largura.
export const ISO_DIAMOND = 0.7071;
export const ISO_ANCHOR_Y = 0.8;
export const ISO_W = 1 / ISO_DIAMOND; // largura do sprite em "casas" (1 = largura do losango)
export const ISO_H = ISO_W * 1.5;

export const isoUrl = (id) => `${import.meta.env.BASE_URL}mandato/iso/${id}.webp`;
export const isoBuilding = (b) => (b.id === 'P-01' ? `P-01-${b.v || 'RES'}` : b.id);
export function isoGround(t, terrain) {
  if (t.k === '.') return terrain === 'deserto' ? 'g-plain-sand' : 'g-plain-grass';
  if (t.k === 'F' && t.cleared) return 'g-Fx';
  return `g-${t.k}`;
}
const ISL_OFF = { M: [0, 0], N: [4, 0], L: [4, 3] };
export const gridPos = (t) => {
  const o = ISL_OFF[t.isl] || [0, 0];
  return [t.x + o[0], t.y + o[1]];
};

// Layout em unidades de "largura do losango". TOP = espaço acima da primeira casa para os prédios altos.
const TOP = 1.05, BOTTOM = 0.36;
export function isoLayout(tiles) {
  const g = tiles.map(gridPos);
  const ds = g.map(([x, y]) => x - y), ss = g.map(([x, y]) => x + y);
  const minD = Math.min(...ds), maxD = Math.max(...ds), minS = Math.min(...ss), maxS = Math.max(...ss);
  const W = (maxD - minD) / 2 + 1;
  const H = TOP + (maxS - minS) / 4 + 0.5 + BOTTOM;
  const pos = g.map(([x, y]) => ({ cx: (x - y - minD) / 2 + 0.5, cy: TOP + (x + y - minS) / 4 + 0.25, z: x + y }));
  return { W, H, pos };
}
