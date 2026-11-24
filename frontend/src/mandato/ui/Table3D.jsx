// Mesa 3D no estilo "tabletop": uma mesa de madeira com o tabuleiro central (Metas, Facções e Fila Especial)
// e a cidade de cada prefeito ao redor, com os prédios modelados no Blender (public/mandato/models/mandato.glb?v=art2,
// gerado por MANDATO/3d/build_sprites.py --glb). A câmera gira/aproxima como no Tabletop Simulator.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { FACTIONS, FAC_KEYS, TERRAINS, STANDARD } from '../data.js';
import { calc, regionalOf, copiesOf } from '../engine.js';
import { HAS_ART, artUrl } from './cardutil.js';
import { TableFurniture, CityFrame, BoardFoundation, SectionTray, RegionalTray } from './TableFurniture.jsx';
import { isoBuilding, isoGround, gridPos } from './iso.js';

const MODEL = `${import.meta.env.BASE_URL}mandato/models/mandato.glb?v=art2`;
const S = 0.5; // escala das cidades: 1 casa = 2 m no modelo → 1 m na mesa
const CARD = [0.9, 1.26]; // carta deitada na mesa (largura × altura)
const SRGB = (t) => { (Array.isArray(t) ? t : [t]).forEach((x) => { x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; }); };

// raio da mesa: as cidades ficam num anel em volta do centro
const ringR = (n) => (n <= 2 ? 11.5 : n <= 4 ? 13.5 : 15.5);
// ângulo de cada assento: o seu fica sempre de frente para a câmera (+Z)
const seatAngle = (k, n) => (n === 2 ? [0, Math.PI][k] : (k / n) * Math.PI * 2);

function useBack() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 180; c.height = 252;
    const g = c.getContext('2d');
    g.fillStyle = '#1B2A41'; g.fillRect(0, 0, 180, 252);
    g.strokeStyle = '#E0A526'; g.lineWidth = 8; g.strokeRect(10, 10, 160, 232);
    g.fillStyle = '#E0A526'; g.font = 'bold 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('M', 90, 130);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

// ------------------------------------------------------------------ texto desenhado na cena
// (canvas → textura). Evita <Html> do drei, que cria uma raiz React por etiqueta e quebrava ao remontar.
function textTexture(lines, { bg = '#F3EBDD', fg = '#1B2A41', border = null, px = 64, bold = true } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fonts = lines.map((l, i) => `${bold && i === 0 ? 'bold ' : ''}${i === 0 ? px : Math.round(px * 0.72)}px "Segoe UI", Arial, sans-serif`);
  const widths = lines.map((l, i) => { g.font = fonts[i]; return g.measureText(l).width; });
  const pad = px * 0.45;
  const lh = lines.map((_, i) => (i === 0 ? px : px * 0.72) * 1.25);
  c.width = Math.ceil(Math.max(...widths) + pad * 2);
  c.height = Math.ceil(lh.reduce((a, b) => a + b, 0) + pad * 1.2);
  const r = px * 0.35;
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, r); g.fill();
  if (border) { g.strokeStyle = border; g.lineWidth = px * 0.12; g.stroke(); }
  g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center';
  let y = pad * 0.6;
  lines.forEach((l, i) => { g.font = fonts[i]; g.fillText(l, c.width / 2, y + lh[i] / 2); y += lh[i]; });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { t, aspect: c.width / c.height };
}
// etiqueta deitada na mesa (títulos das seções, contadores)
function BoardText({ pos, text, h = 0.42 }) {
  const key = [].concat(text).join('');
  const { t, aspect } = useMemo(() => textTexture([key]), [key]);
  useEffect(() => () => t.dispose(), [t]);
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[h * aspect, h]} />
      <meshBasicMaterial map={t} transparent depthWrite={false} />
    </mesh>
  );
}
// placa que sempre olha para a câmera (nome do prefeito, "inativo")
function Tag({ pos, lines, h = 0.5, bg, fg, border }) {
  const key = lines.join('|');
  const { t, aspect } = useMemo(() => textTexture(key.split('|'), { bg, fg, border }), [key, bg, fg, border]);
  useEffect(() => () => t.dispose(), [t]);
  return (
    <sprite position={pos} scale={[h * aspect, h, 1]}>
      <spriteMaterial map={t} transparent depthWrite={false} />
    </sprite>
  );
}

// ------------------------------------------------------------------ peças
function Model({ id, nodes, born }) {
  const ref = useRef();
  const obj = useMemo(() => {
    const src = nodes[id];
    if (!src) return null;
    const o = src.clone(true);
    o.position.set(0, 0, 0);
    o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return o;
  }, [id, nodes]);
  // prédio que surge depois que a mesa já estava montada cai do céu
  const [drop] = useState(() => born != null && performance.now() - born > 1200);
  const t0 = useRef(drop ? -1 : null);
  useFrame((st) => {
    if (t0.current === null || !ref.current) return;
    if (t0.current < 0) t0.current = st.clock.elapsedTime;
    const k = Math.min(1, (st.clock.elapsedTime - t0.current) / 0.55);
    const e = 1 - (1 - k) ** 3;
    ref.current.position.y = (1 - e) * 5;
    ref.current.scale.setScalar(0.6 + 0.4 * e);
    if (k >= 1) t0.current = null;
  });
  if (!obj) return null;
  return <primitive ref={ref} object={obj} />;
}

// Cada carta carrega a própria textura num Suspense local: carta nova na mesa não suspende (nem remonta) a cena.
function CardFlat(props) {
  return <Suspense fallback={null}><CardFlatIn {...props} /></Suspense>;
}
function CardFlatIn({ id, pos, rot = 0, onClick, lift = 0, glow }) {
  const tex = useTexture(HAS_ART.has(id) ? artUrl(id) : artUrl('B-01'), SRGB);
  const [h, setH] = useState(false);
  // a área de clique fica parada; só o desenho da carta sobe no hover (senão a carta "foge" do mouse e pisca)
  return (
    <group position={[pos[0], pos[1] + lift, pos[2]]} rotation={[0, rot, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = onClick ? 'pointer' : ''; }}
        onPointerOut={() => { setH(false); document.body.style.cursor = ''; }}
        onClick={(e) => { if (e.delta > 5 || !onClick) return; e.stopPropagation(); onClick(); }}>
        <planeGeometry args={[CARD[0] + 0.06, CARD[1] + 0.06]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group position={[0, h ? 0.1 : 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} castShadow receiveShadow raycast={() => null}>
          <planeGeometry args={CARD} />
          <meshStandardMaterial map={tex} roughness={0.7} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
        <mesh position={[0, 0, 0]} receiveShadow raycast={() => null}>
          <boxGeometry args={[CARD[0] + 0.04, 0.02, CARD[1] + 0.04]} />
          <meshStandardMaterial color={glow || '#F3EBDD'} emissive={glow || '#000'} emissiveIntensity={glow ? 0.5 : 0} />
        </mesh>
      </group>
    </group>
  );
}

function Pile({ n, pos, back, top }) {
  const h = Math.max(0.02, Math.min(n, 30) * 0.012);
  return (
    <group position={pos}>
      {n > 0 && (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[CARD[0] * 0.8, h, CARD[1] * 0.8]} />
          <meshStandardMaterial color="#E9DFC9" />
        </mesh>
      )}
      {n > 0 && (top ? <TopCard id={top} y={h + 0.01} /> : (
        <mesh position={[0, h + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CARD[0] * 0.8, CARD[1] * 0.8]} />
          <meshStandardMaterial map={back} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
function TopCard(props) {
  return <Suspense fallback={null}><TopCardIn {...props} /></Suspense>;
}
function TopCardIn({ id, y }) {
  const tex = useTexture(HAS_ART.has(id) ? artUrl(id) : artUrl('B-01'), SRGB);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[CARD[0] * 0.8, CARD[1] * 0.8]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  );
}

function Disc({ color, pos, r = 0.16, h = 0.08 }) {
  return (
    <mesh position={[pos[0], pos[1] + h / 2, pos[2]]} castShadow>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

// ------------------------------------------------------------------ cidade de um jogador
function CityBoard({ s, p, nodes, mine, placing, validity, selected, onTile, onHover, back, land }) {
  const c = useMemo(() => calc(s, p), [s, p]);
  const ghosts = land ? land.slots : [];
  const g = [...p.tiles, ...ghosts].map(gridPos);
  const xs = g.map((v) => v[0]), ys = g.map((v) => v[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const w = (Math.max(...xs) - Math.min(...xs) + 1) * 2 * S, d = (Math.max(...ys) - Math.min(...ys) + 1) * 2 * S;
  const island = p.tiles.some((t) => t.isl !== 'M');
  const [born] = useState(() => performance.now());
  const pulse = useRef();
  useFrame((st) => { if (pulse.current) pulse.current.opacity = 0.35 + 0.25 * Math.sin(st.clock.elapsedTime * 4); });
  return (
    <group>
      <CityFrame w={w} d={d} color={p.color} />
      {island && (
        <mesh position={[0, -0.075, 0]} receiveShadow>
          <boxGeometry args={[w + 0.5, 0.02, d + 0.5]} />
          <meshStandardMaterial color="#5FA9C4" roughness={0.2} />
        </mesh>
      )}
      <group scale={S}>
        {p.tiles.map((t, i) => {
          const [gx, gy] = g[i];
          const x = (gx - cx) * 2, z = (gy - cy) * 2;
          const key = t.b ? `${i}:${t.b.id}:${t.b.v || ''}` : null;
          const ok = placing && validity && validity[i] && !validity[i].err;
          const off = t.b && !c.act.has(i);
          return (
            <group key={i} position={[x, 0, z]}>
              <Model id={isoGround(t, p.terrain)} nodes={nodes} />
              {t.b && <Model key={key} id={isoBuilding(t.b)} nodes={nodes} born={born} />}
              {/* área clicável da casa */}
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => { if (e.delta > 5) return; e.stopPropagation(); onTile(p.id, i); }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; if (mine && onHover) onHover(i); }}
                onPointerOut={() => { document.body.style.cursor = ''; if (mine && onHover) onHover(null); }}>
                <planeGeometry args={[1.95, 1.95]} />
                {ok ? <meshBasicMaterial ref={pulse} color="#E0A526" transparent opacity={0.45} depthWrite={false} />
                  : selected === i ? <meshBasicMaterial color="#1B2A41" transparent opacity={0.3} depthWrite={false} />
                    : placing && mine ? <meshBasicMaterial color="#1B2A41" transparent opacity={0.22} depthWrite={false} />
                      : <meshBasicMaterial transparent opacity={0} depthWrite={false} />}
              </mesh>
              {off && (
                <Tag pos={[0, 1.3, 0.6]} lines={[c.off.includes(i) ? 'inativo' : 'falta 👥']} h={0.55} bg="#1B2A41" fg="#F3EBDD" />
              )}
            </group>
          );
        })}
      </group>
      {/* terrenos à venda (modo "Comprar terreno") */}
      <group scale={S}>
        {ghosts.map((o, k) => {
          const [gx, gy] = g[p.tiles.length + k];
          return (
            <group key={`land${o.isl}${o.x}${o.y}`} position={[(gx - cx) * 2, 0, (gy - cy) * 2]}>
              <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => { if (e.delta > 5) return; e.stopPropagation(); land.onPick(o); }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = ''; }}>
                <planeGeometry args={[1.85, 1.85]} />
                <meshBasicMaterial ref={pulse} color="#E0A526" transparent opacity={0.45} depthWrite={false} />
              </mesh>
              <Tag pos={[0, 0.6, 0]} lines={[`+💰${land.cost}`]} h={0.7} bg="#E0A526" />
            </group>
          );
        })}
      </group>
      {/* deck e descarte de cada um, ao lado da cidade */}
      <Pile n={p.deck.length} pos={[w / 2 + 2.35, -0.08, -0.8]} back={back} />
      <Pile n={p.discard.length} pos={[w / 2 + 2.35, -0.08, 0.6]} back={back} top={p.discard[p.discard.length - 1]} />
    </group>
  );
}

// ------------------------------------------------------------------ centro da mesa
// Tabuleiro central em seções:   [ Metas ]  (fundo)
//                [ Facções ]  [ Mercado Padrão ]  [ Obras-Prima ]
//                         [ Fila Especial ]  (frente)
const BW = 15.5, BD = 10.4; // tamanho do tabuleiro central
function Label({ pos, children, small }) {
  return <BoardText pos={[pos[0], 0.06, pos[2]]} text={children} h={small ? 0.25 : 0.36} />;
}
function Section(props) { return <SectionTray {...props} />; }

// trilhas das Facções desenhadas numa textura só (nome, casas 0–6, marco ★ no 3 e Aliança no 5)
const FB = { w: 6.6, rowH: 0.78, name: 1.75, cell: 0.6, tok: 0.65 };
function useFacBoard() {
  return useMemo(() => {
    const k = 160; // px por metro
    const W = Math.round(FB.w * k), H = Math.round(FB.rowH * 4 * k);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#F6EFDF'; g.fillRect(0, 0, W, H);
    FAC_KEYS.forEach((f, r) => {
      const F = FACTIONS[f], y = r * FB.rowH * k, h = FB.rowH * k;
      g.fillStyle = F.color; g.beginPath(); g.roundRect(6, y + 6, FB.name * k - 12, h - 12, 9); g.fill();
      g.fillStyle = '#fff'; g.font = `bold ${Math.round(h * 0.28)}px Georgia, serif`; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillText(F.name, 18, y + h * .43); g.font = `${Math.round(h * .15)}px sans-serif`; g.fillText('INFLUÊNCIA', 18, y + h * .72);
      for (let n = 0; n <= 6; n++) {
        const x = (FB.name + n * FB.cell) * k;
        g.fillStyle = n === 3 ? '#F3D27A' : n === 5 ? '#D9E4E6' : '#EEE4CE';
        g.fillRect(x + 4, y + 6, FB.cell * k - 8, h - 12);
        g.strokeStyle = n === 5 ? F.color : '#1B2A41'; g.lineWidth = n === 5 ? 4 : 1.5; g.strokeRect(x + 4, y + 6, FB.cell * k - 8, h - 12);
        g.fillStyle = '#1B2A41'; g.font = `bold ${Math.round(h * 0.26)}px sans-serif`; g.textAlign = 'center';
        g.fillText(String(n), x + (FB.cell * k) / 2, y + h * 0.3);
        g.font = `bold ${Math.round(h * 0.16)}px sans-serif`;
        if (n === 3) g.fillText('★1', x + (FB.cell * k) / 2, y + h * 0.78);
        if (n === 5) g.fillText('Aliança', x + (FB.cell * k) / 2, y + h * 0.78);
      }
      const tx = (FB.name + 7 * FB.cell) * k;
      g.strokeStyle = F.color; g.lineWidth = 5; g.setLineDash([10, 8]);
      g.beginPath(); g.arc(tx + (FB.tok * k) / 2, y + h / 2, h * 0.32, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
}
function Factions({ s, pos }) {
  const tex = useFacBoard();
  const H = FB.rowH * 4;
  const x0 = pos[0] - FB.w / 2, z0 = pos[1] - H / 2;
  return (
    <group>
      <mesh position={[pos[0], 0.03, pos[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FB.w, H]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      {FAC_KEYS.map((f, r) => {
        const zc = z0 + (r + 0.5) * FB.rowH;
        const byCell = {}; // jogadores na mesma casa ficam lado a lado
        return (
          <group key={f}>
            {s.players.map((p) => {
              const n = Math.min(6, p.fac[f]);
              const k = (byCell[n] = (byCell[n] ?? -1) + 1);
              const x = x0 + FB.name + (n + 0.5) * FB.cell + ((k % 3) - 1) * 0.16;
              const z = zc + (k < 3 ? -0.04 : 0.2);
              return (
                <mesh key={p.id} position={[x, 0.11, z]} castShadow>
                  <boxGeometry args={[0.14, 0.14, 0.14]} />
                  <meshStandardMaterial color={p.color} roughness={0.35} />
                </mesh>
              );
            })}
            {s.tokens[f] != null && <Disc color={s.players[s.tokens[f]].color} pos={[x0 + FB.name + 7 * FB.cell + FB.tok / 2, 0.03, zc]} r={0.2} h={0.12} />}
          </group>
        );
      })}
    </group>
  );
}

function Stack({ id, n, pos, onClick }) {
  const h = Math.max(0.02, Math.min(n, 40) * 0.01);
  return (
    <group position={pos}>
      {n > 0 && (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[CARD[0], h, CARD[1]]} />
          <meshStandardMaterial color="#E9DFC9" />
        </mesh>
      )}
      <CardFlat id={id} pos={[0, h + 0.012, 0]} onClick={onClick} />
    </group>
  );
}

function Center({ s, onPick }) {
  const goals = s.goals.slots;
  const gw = 1.2;
  const gx0 = -((goals.length - 1) * gw) / 2;
  const rowN = s.market.row.length;
  const vit = s.market.vit;
  return (
    <group>
      <BoardFoundation w={BW} d={BD} />
      <BoardText pos={[-5.75, 0.035, -3.8]} text="MANDATO" h={0.55} />
      <BoardText pos={[-5.75, 0.035, -3.25]} text="PLANEJAMENTO URBANO" h={0.16} />
      <BoardText pos={[5.8, 0.035, -3.8]} text="CIDADES & CIDADÃOS" h={0.22} />
      <BoardText pos={[5.8, 0.035, -3.3]} text="CONSTRUIR · GOVERNAR · PROSPERAR" h={0.13} />
      {/* Metas (fundo) */}
      <Section pos={[0, -3.55]} size={[Math.max(7, goals.length * gw + 0.6), 2.75]} />
      <Label pos={[0, 0.1, -5.05]}>Metas · 🥇 ⭐2 · 🥈 ⭐1</Label>
      {goals.map((sl, i) => {
        const x = gx0 + i * gw;
        const who = (k) => (sl[k] === 'R' ? '#1B2A41' : sl[k] != null ? s.players[sl[k]].color : null);
        return (
          <group key={sl.id + i}>
            <CardFlat id={sl.id} pos={[x, 0.04, -3.9]} onClick={() => onPick({ k: 'goal', i })} />
            <Disc color="#E6B422" pos={[x - 0.22, 0.02, -2.85]} r={0.17} h={0.05} />
            <Disc color="#C9CDD3" pos={[x + 0.22, 0.02, -2.85]} r={0.17} h={0.05} />
            {who('gold') && <Disc color={who('gold')} pos={[x - 0.22, 0.07, -2.85]} r={0.12} h={0.1} />}
            {who('silver') && <Disc color={who('silver')} pos={[x + 0.22, 0.07, -2.85]} r={0.12} h={0.1} />}
          </group>
        );
      })}

      {/* Facções (meio, à esquerda) */}
      <Factions s={s} pos={[-3.95, -0.25]} />
      <Label pos={[-3.95, 0.1, -1.95]}>Facções</Label>

      {/* Mercado Padrão (meio): as 4 pilhas, com quantas cartas restam */}
      <Section pos={[1.85, -0.25]} size={[4.5, 3.3]} color="#DDE3D1" />
      <Label pos={[1.85, 0.1, -1.95]}>Mercado Padrão</Label>
      {STANDARD.map((id, i) => {
        const x = 0.55 + (i % 2) * 2.3, z = -0.95 + Math.floor(i / 2) * 1.5;
        const n = s.market.piles[id] ?? 0;
        return (
          <group key={id}>
            <Stack id={id} n={n} pos={[x, 0.03, z]} onClick={() => onPick({ k: 'pile', id })} />
            <Label pos={[x + 0.8, 0.2, z]} small>×{n}</Label>
          </group>
        );
      })}

      {/* Obras-Prima (meio, à direita) */}
      <Section pos={[5.95, -0.25]} size={[3.1, 3.3]} color="#DFCAA0" />
      <Label pos={[5.95, 0.1, -1.95]}>Obras-Prima</Label>
      {vit.map((id, i) => (
        <CardFlat key={id + i} id={id} pos={[5.3 + (i % 2) * 1.3, 0.04, -0.95 + Math.floor(i / 2) * 1.45]} glow="#C9A227" onClick={() => onPick({ k: 'wonder', i })} />
      ))}

      {/* Fila Especial (frente) */}
      <Section pos={[0, 3.5]} size={[Math.max(7, rowN * 1.05 + 0.6), 2.4]} />
      {s.market.row.map((id, i) => (
        <CardFlat key={id + i} id={id} pos={[-((rowN - 1) * 1.05) / 2 + i * 1.05, 0.04, 3.45]} onClick={() => onPick({ k: 'row', i })} />
      ))}
      <Label pos={[0, 0.1, 4.95]}>Fila Especial · gira 1 por rodada</Label>
    </group>
  );
}

// Projetos Regionais de cada prefeito, em fila ao lado da cidade (comprado = borda e disco na cor do jogador)
function Regionals({ p, x, mine, onPick, onZoom }) {
  return (
    <group>
      <RegionalTray x={x} />
      {regionalOf(p).map((id, i) => {
        const z = -1.5 + i * 1.5;
        const n = copiesOf(p, id);
        return (
          <group key={id}>
            <CardFlat id={id} pos={[x, -0.06, z]} onClick={() => (mine ? onPick({ k: 'reg', id }) : onZoom(id))} glow={n ? p.color : undefined} />
            {n > 0 && <Disc color={p.color} pos={[x + 0.3, -0.03, z + 0.45]} r={0.14} h={0.08} />}
          </group>
        );
      })}
      <Label pos={[x, 0.2, -2.45]} small>Regionais</Label>
    </group>
  );
}

// ------------------------------------------------------------------ mesa
function Scene({ s, viewer, act, placing, validity, sel, onTile, onHover, onPick, onZoom, camRef, onReady, land }) {
  const { nodes } = useGLTF(MODEL);
  const back = useBack();
  const n = s.players.length;
  const R = ringR(n);
  // gira a ordem para o seu assento ficar na frente
  const order = [...s.players.slice(viewer), ...s.players.slice(0, viewer)];
  // a cena só monta depois que o modelo carregou: aí a câmera já existe e vai direto para a sua cidade
  const half0 = cityHalfW(s.players[viewer]);
  useEffect(() => { if (camRef.current) camRef.current.setLookAt(...seatView(0, n, R, half0), false); }, [camRef, n, R, half0]);
  useEffect(() => { onReady(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <hemisphereLight args={['#FFF5E2', '#797465', 1.8]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 22, 12]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-R - 8} shadow-camera-right={R + 8} shadow-camera-top={R + 8} shadow-camera-bottom={-R - 8} shadow-bias={-0.0004} />
      <TableFurniture radius={R} />
      <Center s={s} onPick={onPick} />
      {order.map((p, k) => {
        const a = seatAngle(k, n);
        const mine = p.id === viewer;
        const T = TERRAINS[p.terrain];
        return (
          <group key={p.id} position={[Math.sin(a) * R, 0, Math.cos(a) * R]} rotation={[0, a, 0]}>
            <CityBoard s={s} p={p} nodes={nodes} mine={mine} active={!s.over && act === p.id} back={back}
              placing={mine && !!placing} validity={mine ? validity : null}
              selected={sel && sel.k === 'tile' && (sel.pid ?? viewer) === p.id ? sel.i : null}
              onTile={onTile} onHover={mine ? onHover : undefined} land={mine ? land : null} />
            <Regionals p={p} mine={mine} onPick={onPick} onZoom={onZoom} x={cityHalfW(p) + 1.15} />
            <Tag pos={[0, 0.7, (p.tiles.some((t) => t.isl !== 'M') ? 3.5 : 2.8)]} h={0.62}
              lines={[`${p.name}${mine ? ' (você)' : ''}  ★${p.merit}`, `${T.name} · 👥${calc(s, p).pop} · 😊${p.approval}${act === p.id && !s.over ? ' · NA VEZ' : ''}`]}
              bg={act === p.id && !s.over ? '#E0A526' : '#F3EBDD'} border={p.color} />
          </group>
        );
      })}
      <CameraControls ref={camRef} makeDefault minDistance={4} maxDistance={R * 6} maxPolarAngle={Math.PI * 0.44} minPolarAngle={0.15} dollySpeed={0.6} truckSpeed={1.2} />
    </>
  );
}

// câmera atrás de um assento (k = posição na mesa, 0 = você), olhando para a cidade dele
function seatView(k, n, R, half = 2) {
  const a = seatAngle(k, n), ux = Math.sin(a), uz = Math.cos(a);
  const f = (half + 2.2) / 4.2; // cidades maiores (Ilha) pedem a câmera mais longe
  const rx = Math.cos(a), rz = -Math.sin(a); // "direita" do assento: puxa o quadro para os Regionais
  const tx = ux * (R + 1.4) + rx * 1.2, tz = uz * (R + 1.4) + rz * 1.2;
  return [tx + ux * 7.4 * f, 8.6 * f, tz + uz * 7.4 * f, tx, 0, tz];
}
const VIEWS = {
  center: () => [0, 22, 18, 0, 0, 0],
  all: (R) => [0, (R + 6) * 2.5, (R + 6) * 1.65, 0, 0, 3.2],
};
const cityHalfW = (p) => {
  const xs = p.tiles.map((t) => gridPos(t)[0]);
  return (Math.max(...xs) - Math.min(...xs) + 1) * S;
};

export default function Table3D(props) {
  const { s, viewer } = props;
  const camRef = useRef();
  const [view, setView] = useState('seat0');
  const [ready, setReady] = useState(false);
  const n = s.players.length;
  const R = ringR(n);
  const order = [...s.players.slice(viewer), ...s.players.slice(0, viewer)];
  const target = (v) => (v.startsWith('seat') ? seatView(+v.slice(4), n, R, cityHalfW(order[+v.slice(4)])) : VIEWS[v](R));
  const move = (v, smooth = true) => { if (camRef.current) camRef.current.setLookAt(...target(v), smooth); };
  const go = (v) => { setView(v); move(v); };
  // ao escolher onde construir, a câmera volta para a sua cidade
  const landOn = !!props.land;
  useEffect(() => { if (props.placing || landOn) move('seat0'); }, [props.placing, landOn]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tt-wrap">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 38, position: seatView(0, n, R, cityHalfW(order[0])).slice(0, 3), near: 0.5, far: 500 }} gl={{ antialias: true }}>
        <color attach="background" args={['#C6BDAA']} />
        <fog attach="fog" args={['#C6BDAA', R * 3.5, R * 7]} />
        <Suspense fallback={null}>
          <Scene {...props} camRef={camRef} onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>
      {!ready && <div className="tt-loading">carregando a mesa 3D…</div>}
      <div className="tt-cams" role="toolbar" aria-label="Câmera">
        {order.map((p, k) => (
          <button key={p.id} type="button" className={view === `seat${k}` ? 'on' : ''} onClick={() => go(`seat${k}`)} title={`Ver a cidade de ${p.name}`}>
            <i className="tt-dot" style={{ background: p.color }} />{k === 0 ? 'Você' : p.name}
          </button>
        ))}
        {[['center', 'Centro'], ['all', 'Mesa toda']].map(([k, l]) => (
          <button key={k} type="button" className={view === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>
        ))}
      </div>
      <p className="tt-help">arraste para girar · botão direito move · roda aproxima</p>
    </div>
  );
}

useGLTF.preload(MODEL);
