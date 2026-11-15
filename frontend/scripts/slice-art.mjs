// Recorta as folhas de arte geradas por IA (MANDATO/images) em uma imagem por carta, nomeada pelo ID.
//   npm i --no-save sharp && node scripts/slice-art.mjs [prefixo-de-id]
// Saída: public/mandato/art/<ID>.webp e src/mandato/artManifest.js (lista dos IDs com arte).
// A ordem das células segue MANDATO/12_guia_de_prompts_ia.md; `null` ignora a célula.
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SRC = resolve(ROOT, '../MANDATO/images');
const OUT = resolve(ROOT, 'public/mandato/art');
const only = process.argv[2] || '';

const seq = (p, a, b, pad = 2) => Array.from({ length: b - a + 1 }, (_, i) => `${p}${String(a + i).padStart(pad, '0')}`);

// kind: land (4:3, cenas e edifícios) | portrait (4:5) | arch (4:5, exploração) | circle (1:1 com máscara) | sq (1:1)
const SHEETS = [
  // ---- Edificações
  { find: 'sx3fldsx3f', cols: 4, rows: 2, kind: 'land', inset: 0.07, ids: seq('E1-', 1, 8) },
  { find: 'zgqrknzgqr', cols: 3, rows: 3, kind: 'land', inset: 0.07, ids: seq('E2-', 1, 9) },
  { find: 'ud729yud72', cols: 4, rows: 2, kind: 'land', ids: [...seq('E3-', 1, 7), null] },
  // ---- Regionais
  { find: 'eizfg5eizf', cols: 3, rows: 3, kind: 'land', ids: ['R-LIT-1', 'R-LIT-2', 'R-LIT-3', 'R-MON-1', 'R-MON-2', 'R-MON-3', 'R-PLA-1', 'R-PLA-2', 'R-PLA-3'] },
  { find: 'hrn8zehrn8', cols: 3, rows: 3, kind: 'land', ids: ['R-DES-1', 'R-DES-2', 'R-DES-3', 'R-FLO-1', 'R-FLO-2', 'R-FLO-3', 'R-ILH-1', 'R-ILH-2', 'R-ILH-3'] },
  // ---- Administração (retratos)
  { find: '2kkprl2kkp', cols: 4, rows: 2, kind: 'portrait', ids: [...seq('A1-', 1, 7), null] },
  { find: 'qyb1gjqyb1', cols: 4, rows: 2, kind: 'portrait', ids: seq('A2-', 1, 8) },
  // 4ª célula (homem da tesoura) fica de fora por decisão de design
  { find: 'w0zjegw0zj', cols: 4, rows: 2, kind: 'portrait', ids: ['A3-01', 'A3-02', 'A3-03', null, 'A3-04', 'A3-05', null, null] },
  // ---- Básicas + Padrão, Decretos, Intrigas, Obras-Prima
  { find: 'v3npkev3np', cols: 4, rows: 2, kind: 'land', ids: ['B-01', 'B-02', 'B-03', 'B-04', 'P-01', 'P-02', 'P-03', 'P-04'] },
  { find: 'osuat2osua', cols: 3, rows: 2, kind: 'land', ids: ['D1-01', 'D1-02', 'D2-01', 'D2-02', 'D2-03', 'D3-01'] },
  { find: '40klpa40kl', cols: 5, rows: 2, kind: 'cover1', fy: 0.08, ids: ['I1-01', 'I1-02', 'I1-03', 'I2-01', 'I2-02', 'I2-03', 'I2-04', 'I3-01', 'I3-02', 'I3-03'] },
  { find: '7k9eyi7k9e', cols: 4, rows: 3, kind: 'land', ids: seq('M-', 1, 12) },
  // ---- Exploração (6 folhas de 10)
  { find: 'Azulejos Costeiros', cols: 5, rows: 2, kind: 'arch', ids: seq('X-LIT-', 1, 10) },
  { find: 'Montanha e Minera', cols: 5, rows: 2, kind: 'arch', ids: seq('X-MON-', 1, 10) },
  { find: 'Vida Rural', cols: 5, rows: 2, kind: 'arch', ids: seq('X-PLA-', 1, 10) },
  { find: 'Deserto em Dez', cols: 5, rows: 2, kind: 'arch', ids: seq('X-DES-', 1, 10) },
  { find: 'Floresta Amaz', cols: 5, rows: 2, kind: 'arch', ids: seq('X-FLO-', 1, 10) },
  { find: 'Paraíso Mar', cols: 5, rows: 2, kind: 'arch', ids: seq('X-ILH-', 1, 10) },
  // ---- Metas, Rodada, Facções
  { find: 'Urbanos Retr', cols: 3, rows: 2, kind: 'circle', ids: seq('G-', 1, 6) },
  { find: 'Seis Emblemas', cols: 3, rows: 2, kind: 'circle', ids: seq('G-', 7, 12) },
  { find: 'conquista e explora', cols: 3, rows: 2, kind: 'circle', ids: seq('G-', 13, 18) },
  { find: 'Desafios Nacionais', cols: 4, rows: 3, kind: 'sq', ids: seq('RD-', 1, 12) },
  { find: 'quatro cores', cols: 2, rows: 2, kind: 'sq', ids: ['F-tec', 'F-ver', 'F-emp', 'F-sin'], pad: 0.02, inset: 0.01 },
  // folha extra (guia 12 §12): casas iniciais e o Loteamento em cada Zona; opcional até ser gerada
  { find: 'Prefeitura e Loteamento', cols: 3, rows: 2, kind: 'land', optional: true, ids: ['PREF', 'HOME', 'P-01-RES', 'P-01-COM', 'P-01-IND', 'P-01-INF'] },
];

const KIND = {
  land: { ratio: 4 / 3, w: 800, pad: 0.1, inset: 0.02 },
  portrait: { ratio: 4 / 5, w: 600, pad: 0.04, inset: 0.02 },
  arch: { ratio: 4 / 5, w: 400, pad: 0.04, inset: 0.01 },
  circle: { ratio: 1, w: 360, pad: 0.01, inset: 0.04, mask: 'circle' },
  sq: { ratio: 1, w: 420, pad: 0.03, inset: 0.01 },
  cover1: { ratio: 1, w: 640, pad: 0, inset: 0.01, cover: true }, // Intrigas: formas irregulares, recorte quadrado dentro da forma
};

const files = await readdir(SRC);
const pick = (frag) => {
  const f = files.filter((n) => n.normalize('NFC').includes(frag.normalize('NFC')) && /\.(png|jpe?g)$/i.test(n));
  if (f.length !== 1) throw new Error(`folha "${frag}": ${f.length} arquivos encontrados`);
  return resolve(SRC, f[0]);
};

// cor de fundo = média dos quatro cantos do recorte
function cornerColor(buf, w, h, ch) {
  const n = 6;
  let r = 0, g = 0, b = 0, c = 0;
  for (const [x0, y0] of [[0, 0], [w - n, 0], [0, h - n], [w - n, h - n]]) {
    for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) { const i = (y * w + x) * ch; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; c++; }
  }
  return [Math.round(r / c), Math.round(g / c), Math.round(b / c)];
}

async function cutCell(file, rect, o) {
  const k = KIND[o.kind];
  const inset = o.inset ?? k.inset;
  o = { ...o, cover: o.cover ?? k.cover };
  const x = Math.round(rect.x + rect.w * inset), y = Math.round(rect.y + rect.h * inset);
  const w = Math.round(rect.w * (1 - 2 * inset)), h = Math.round(rect.h * (1 - 2 * inset));
  const slot = { left: x, top: y, width: w, height: h };
  const SW = 320;
  const scale = SW / w;
  const { data, info } = await sharp(file).extract(slot).resize(SW).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = cornerColor(data, info.width, info.height, 3);
  const T = 30;
  const mask = new Uint8Array(info.width * info.height);
  const rows = new Array(info.height).fill(0), cols = new Array(info.width).fill(0);
  for (let j = 0; j < info.height; j++) {
    for (let i = 0; i < info.width; i++) {
      const p = (j * info.width + i) * 3;
      const d = Math.abs(data[p] - bg[0]) + Math.abs(data[p + 1] - bg[1]) + Math.abs(data[p + 2] - bg[2]);
      if (d > T) mask[j * info.width + i] = 1;
    }
  }
  // só o maior objeto conta para o enquadramento (ignora pedaços do retrato vizinho)
  if (o.kind === 'portrait' || o.kind === 'arch') {
    const lab = new Int32Array(mask.length);
    const sizes = [0];
    let n = 0;
    const W = info.width, H = info.height;
    for (let s0 = 0; s0 < mask.length; s0++) {
      if (!mask[s0] || lab[s0]) continue;
      n++; sizes[n] = 0;
      const st = [s0]; lab[s0] = n;
      while (st.length) {
        const p = st.pop(); sizes[n]++;
        const px = p % W, py = (p / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const qx = px + dx, qy = py + dy;
          if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
          const q = qy * W + qx;
          if (mask[q] && !lab[q]) { lab[q] = n; st.push(q); }
        }
      }
    }
    const big = sizes.indexOf(Math.max(...sizes.slice(1)));
    for (let p = 0; p < mask.length; p++) if (mask[p] && lab[p] !== big) mask[p] = 0;
  }
  for (let j = 0; j < info.height; j++) for (let i = 0; i < info.width; i++) if (mask[j * info.width + i]) { rows[j]++; cols[i]++; }
  const first = (a, m) => a.findIndex((v) => v >= m);
  const last = (a, m) => a.length - 1 - [...a].reverse().findIndex((v) => v >= m);
  let x0 = first(cols, 2), x1 = last(cols, 2), y0 = first(rows, 2), y1 = last(rows, 2);
  if (x0 < 0 || y0 < 0) { x0 = 0; y0 = 0; x1 = info.width - 1; y1 = info.height - 1; }
  // para coordenadas do recorte original
  let bx = x0 / scale, by = y0 / scale, bw = (x1 - x0 + 1) / scale, bh = (y1 - y0 + 1) / scale;
  const ob = { x: bx, y: by, w: bw, h: bh };
  const pad = o.pad ?? k.pad;
  let cw, ch, cx, cy;
  if (o.cover) { // maior retângulo na proporção dentro do conteúdo (para formas irregulares)
    cw = bw; ch = bw / k.ratio;
    if (ch > bh) { ch = bh; cw = bh * k.ratio; }
    cx = bx + bw / 2; cy = by + (bh - ch) * (o.fy ?? 0.5) + ch / 2;
  } else {
    bw *= 1 + 2 * pad; bh *= 1 + 2 * pad;
    cw = Math.max(bw, bh * k.ratio); ch = cw / k.ratio;
    cx = bx + (x1 - x0 + 1) / scale / 2; cy = by + (y1 - y0 + 1) / scale / 2;
  }
  // monta no tamanho final sobre a cor de fundo (recorte pode passar da borda da célula)
  const ow = Math.round(cw), oh = Math.round(ch);
  const left = Math.round(cx - cw / 2), top = Math.round(cy - ch / 2);
  const sx = Math.max(0, left), sy = Math.max(0, top);
  const ex = Math.min(w, left + ow), ey = Math.min(h, top + oh);
  let inner = await sharp(file).extract({ left: slot.left + sx, top: slot.top + sy, width: Math.max(1, ex - sx), height: Math.max(1, ey - sy) }).toBuffer();
  if (o.kind === 'portrait' || o.kind === 'arch') { // apaga pedaços de células vizinhas fora do objeto principal
    const m = Math.round(Math.min(ob.w, ob.h) * 0.01);
    const iw = ex - sx, ih = ey - sy;
    const fill = (l, t2, w2, h2) => (w2 > 0 && h2 > 0 ? { input: { create: { width: w2, height: h2, channels: 3, background: { r: bg[0], g: bg[1], b: bg[2] } } }, left: l, top: t2 } : null);
    const L = Math.round(ob.x - m - sx), R = Math.round(ob.x + ob.w + m - sx);
    const Tp = Math.round(ob.y - m - sy), Bt = Math.round(ob.y + ob.h + m - sy);
    const rects = [fill(0, 0, L, ih), fill(R, 0, iw - R, ih), fill(0, 0, iw, Tp), fill(0, Bt, iw, ih - Bt)].filter(Boolean);
    if (rects.length) inner = await sharp(inner).composite(rects).toBuffer();
  }
  let img = sharp({ create: { width: ow, height: oh, channels: 3, background: { r: bg[0], g: bg[1], b: bg[2] } } })
    .composite([{ input: inner, left: sx - left, top: sy - top }]);
  img = sharp(await img.png().toBuffer()).resize(k.w, Math.round(k.w / k.ratio));
  if (k.mask === 'circle') {
    const d = k.w;
    const m = Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);
    img = sharp(await img.png().toBuffer()).ensureAlpha().composite([{ input: m, blend: 'dest-in' }]);
  }
  return img.webp({ quality: k.mask ? 84 : 80, effort: 5 });
}

await mkdir(OUT, { recursive: true });
const made = [];
for (const s of SHEETS) {
  if (s.optional && !files.some((n) => n.normalize('NFC').includes(s.find))) { console.log(`${s.find}: ainda não existe (pulado)`); continue; }
  const file = pick(s.find);
  const meta = await sharp(file).metadata();
  const cw = meta.width / s.cols, ch = meta.height / s.rows;
  for (let i = 0; i < s.ids.length; i++) {
    const id = s.ids[i];
    if (!id) continue;
    if (only && !id.startsWith(only)) continue;
    const rect = { x: (i % s.cols) * cw, y: Math.floor(i / s.cols) * ch, w: cw, h: ch };
    const img = await cutCell(file, rect, s);
    await img.toFile(resolve(OUT, `${id}.webp`));
    made.push(id);
  }
  console.log(`${s.find}: ${s.ids.filter(Boolean).length} recortes`);
}

// mapas dos terrenos (vistos de cima) e favicon
const maps = [['Topogr', 'litoral'], ['Montanhas e Min', 'montanha'], ['Rio Serpenteante', 'planicie'], ['Oásis Turquesa', 'deserto'], ['Rio e Florestas', 'floresta'], ['Ilhas e Terrenos', 'ilha']];
if (!only || only === 'T-') {
  for (const [frag, key] of maps) {
    await sharp(pick(frag)).resize(1000).webp({ quality: 78, effort: 5 }).toFile(resolve(OUT, `T-${key}.webp`));
    made.push(`T-${key}`);
  }
}
if (!only || only === 'favicon') {
  const fav = pick('tf6v29tf6v29');
  const m = await sharp(fav).metadata();
  const a = Math.round(m.width * 0.1), s = m.width - 2 * a; // quadrado azul sem a margem creme
  const sq = await sharp(fav).extract({ left: a, top: a, width: s, height: s }).toBuffer();
  const round = (px) => Buffer.from(`<svg width="${px}" height="${px}"><rect width="${px}" height="${px}" rx="${px * 0.2}" fill="#fff"/></svg>`);
  const dir = resolve(ROOT, 'public/mandato');
  for (const [px, name] of [[512, 'icon-512.png'], [180, 'apple-touch-icon.png'], [64, 'favicon.png']]) {
    const buf = await sharp(sq).resize(px, px).ensureAlpha().composite([{ input: round(px), blend: 'dest-in' }]).png().toBuffer();
    await writeFile(resolve(dir, name), buf);
  }
  console.log('favicon gerado');
}

if (!only) {
  const ids = made.sort();
  await writeFile(resolve(ROOT, 'src/mandato/artManifest.js'),
    `// Gerado por scripts/slice-art.mjs — IDs que têm arte em public/mandato/art/<ID>.webp\nexport const ART_IDS = new Set(${JSON.stringify(ids.filter((i) => !i.startsWith('T-')))});\nexport const TERRAIN_ART = ${JSON.stringify(ids.filter((i) => i.startsWith('T-')).map((i) => i.slice(2)))};\n`);
  console.log(`${ids.length} imagens`);
}
