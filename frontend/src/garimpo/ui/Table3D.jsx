// Mesa 3D do GARIMPO: o tabuleiro em corte deitado na mesa, as salas descobertas como peças,
// garimpeiros, relíquias, cristais, a Bateia com os cubos e os chefes.
// Usa os modelos de public/garimpo/models/garimpo.glb (em cm) pelo nome do objeto; o que ainda não foi
// modelado aparece com geometria simples no mesmo lugar, para trocar quando o modelo chegar.
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as E from '../engine.js';
import { RELICS } from '../data.js';
import { ROOM_COLOR, PLAYER_HEX, roomLabel } from './text.js';

const MODEL = `${import.meta.env.BASE_URL}garimpo/models/garimpo.glb?v=1`;
const TILE = 7; // cm por casa
const GAP = 0.6;

const SUB = 3.2; // cm entre salas dentro de uma peça (a peça tem 3×3, ~9,6 cm)
function cell(s, n) {
  const nd = s.map.nodes[n];
  if (s.map.tiles) return [nd.x * SUB, nd.y * SUB];
  return [(nd.x - 5) * 0.9 * (TILE + GAP), nd.lv * (TILE + GAP)];
}

// Texto desenhado numa textura de canvas (sem fonte externa: a cena não espera rede)
const TEX = new Map();
function textTexture(text, color, w, h) {
  const key = `${text}|${color}|${w}|${h}`;
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round((512 * h) / w);
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = c.height * 0.62;
  g.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`;
  while (g.measureText(text).width > c.width * 0.94 && size > 10) { size -= 2; g.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`; }
  g.fillText(text, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  TEX.set(key, t);
  return t;
}
function Text({ children, position, rotation, fontSize = 1, color = '#fff', maxWidth = 6 }) {
  const text = String(children);
  const w = Math.min(maxWidth, Math.max(fontSize * 1.2, text.length * fontSize * 0.62)); const h = fontSize * 1.4;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={textTexture(text, color, w, h)} transparent depthWrite={false} />
    </mesh>
  );
}

// Peça do GLB pelo nome (a geometria vem em cm, com a base em y=0)
function Piece({ nodes, name, color, ...props }) {
  const n = nodes[name];
  if (!n) return null;
  const mat = color ? new THREE.MeshStandardMaterial({ color, roughness: 0.7 }) : n.material;
  return <mesh geometry={n.geometry} material={mat} castShadow receiveShadow {...props} />;
}

function Mine({ s, nodes }) {
  const ids = E.nodeIds(s);
  const pos = useMemo(() => Object.fromEntries(ids.map((n) => [n, cell(s, n)])), [s, ids]);
  // o tabuleiro fica deitado: x = coluna, z = profundidade (nível)
  const at = (n, y = 0) => [pos[n][0], y, pos[n][1]];
  const tiles = s.map.tiles ? Object.entries(s.map.tiles) : [];
  return (
    <group position={[0, 0, -2]}>
      {tiles.map(([k, t]) => {
        const [tx, ty] = k.split(',').map(Number);
        return (
          <RoundedBox key={k} args={[SUB * 3 - 0.3, 0.6, SUB * 3 - 0.3]} radius={0.35} position={[(tx * 3 + 1) * SUB, 0.3, (ty * 3 + 1) * SUB]} receiveShadow castShadow>
            <meshStandardMaterial color={tx === 0 && ty === 0 ? '#6a5236' : t.zone === 'segura' ? '#5a4632' : '#3a2e22'} roughness={0.9} />
          </RoundedBox>
        );
      })}
      {ids.map((n) => {
        const kind = s.map.nodes[n].kind || 'vazia';
        return (
          <group key={n} position={at(n)}>
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.25, 1.35, 0.35, 28]} />
              <meshStandardMaterial color={ROOM_COLOR[kind] || '#5b4a3a'} roughness={0.8} />
            </mesh>
            <Text position={[0, 0.95, 1.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.42} color="#f3ebdd" maxWidth={3}>{roomLabel(kind)}</Text>
            {kind === 'altar' && <Piece nodes={nodes} name="board_altar" position={[0, 0.9, 0]} scale={0.45} />}
            {s.relics[n] && (
              <group position={[0, kind === 'altar' ? 1.5 : 1, 0]}>
                <mesh castShadow><cylinderGeometry args={[0.6, 0.6, 0.4, 20]} /><meshStandardMaterial color="#e8b53a" metalness={0.6} roughness={0.35} /></mesh>
                <Text position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.7} color="#1a1714">{RELICS[s.relics[n]].pts}</Text>
              </group>
            )}
            {Array.from({ length: s.crystals[n] || 0 }).map((_, k) => <Piece key={k} nodes={nodes} name="cristal" position={[-0.9 + k * 0.9, 0.9, -0.7]} scale={0.5} />)}
            {kind === 'veio' && <Piece nodes={nodes} name="pepita" position={[0.7, 0.9, -0.6]} scale={0.7} />}
            {s.grisu.includes(n) && <mesh position={[0, 2, 0]}><sphereGeometry args={[1.1, 16, 12]} /><meshStandardMaterial color="#c8d65a" transparent opacity={0.35} /></mesh>}
          </group>
        );
      })}
      {s.map.edges.map((e) => {
        const a = pos[e.a]; const b = pos[e.b];
        const mid = [(a[0] + b[0]) / 2, 0.9, (a[1] + b[1]) / 2];
        const vertical = Math.abs(a[0] - b[0]) < 0.01;
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (e.type === 'elev') return null;
        const blocked = s.rubble.includes(e.key);
        if (e.type === 'lad') return <Piece key={e.key} nodes={nodes} name="board_escada" position={[mid[0], 0.8, mid[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, len / 6, 0.5]} />;
        if (e.type === 'rail') return <Piece key={e.key} nodes={nodes} name="board_trilho" position={[mid[0], 0.65, mid[2]]} rotation={[0, vertical ? Math.PI / 2 : 0, 0]} scale={[len / 10, 1, 0.35]} />;
        return (
          <mesh key={e.key} position={[mid[0], 0.68, mid[2]]} rotation={[0, vertical ? 0 : Math.PI / 2, 0]}>
            <boxGeometry args={[e.type === 'dark' ? 0.45 : 0.7, 0.12, len]} />
            <meshStandardMaterial color={blocked ? '#5a5550' : e.type === 'dark' ? '#1a1714' : e.type === 'shaft' ? '#2f5d7c' : '#7a4a2b'} />
          </mesh>
        );
      })}
      {s.players.filter(E.inMine).map((p, k) => {
        const [x, z] = pos[p.node];
        return (
          <group key={p.id} position={[x - 0.6 + (k % 2) * 1.2, 0.9, z + 0.3 + Math.floor(k / 2) * 0.9]} scale={0.6}>
            <mesh castShadow position={[0, 1, 0]}><cylinderGeometry args={[0.45, 0.65, 2, 14]} /><meshStandardMaterial color={PLAYER_HEX[p.color]} /></mesh>
            <mesh castShadow position={[0, 2.4, 0]}><sphereGeometry args={[0.55, 14, 12]} /><meshStandardMaterial color={PLAYER_HEX[p.color]} /></mesh>
          </group>
        );
      })}
      {s.cerb && (() => { const [x, z] = pos[s.cerb.node]; return <group position={[x + 1.4, 0.9, z]} scale={0.6}>{[0, 1, 2].map((h) => <mesh key={h} castShadow position={[(h - 1) * 0.8, 1.4, 0]}><sphereGeometry args={[0.5, 12, 10]} /><meshStandardMaterial color={h < s.cerb.awake ? '#d2482b' : '#7a5a2a'} /></mesh>)}<mesh position={[0, 0.6, 0]}><boxGeometry args={[2.6, 1.2, 1.4]} /><meshStandardMaterial color="#7a5a2a" /></mesh></group>; })()}
      {s.medusa && (() => { const [x, z] = pos[s.medusa.node]; return <mesh castShadow position={[x + 1.4, 1.6, z]} scale={0.6}><coneGeometry args={[0.9, 3, 12]} /><meshStandardMaterial color="#3e8c7e" /></mesh>; })()}
    </group>
  );
}

function Bateia({ s, nodes }) {
  const cubes = [];
  for (let i = 0; i < Math.min(s.bag.stone, 24); i++) cubes.push({ k: `s${i}`, name: 'cubo_pedra', color: null });
  s.players.forEach((p) => { for (let i = 0; i < Math.min(s.bag.p[p.id], 20); i++) cubes.push({ k: `${p.id}-${i}`, name: 'cubo_jogador', color: PLAYER_HEX[p.color] }); });
  return (
    <group position={[26, 0, 6]}>
      <mesh receiveShadow position={[0, 0.6, 0]}><cylinderGeometry args={[6, 5, 1.2, 32]} /><meshStandardMaterial color="#6b4a2a" roughness={0.6} /></mesh>
      {cubes.map((c, i) => {
        const a = i * 2.39996; const r = 0.8 + Math.sqrt(i) * 0.75;
        return <Piece key={c.k} nodes={nodes} name={c.name} color={c.color} position={[Math.cos(a) * Math.min(r, 4.6), 1.2 + Math.floor(i / 30) * 0.8, Math.sin(a) * Math.min(r, 4.6)]} rotation={[0, a, 0]} />;
      })}
      <Text position={[0, 0.05, 7.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.2} color="#f3ebdd">{`Bateia · Fúria ${s.fury}`}</Text>
    </group>
  );
}

function Scene({ s, onReady }) {
  const { nodes } = useGLTF(MODEL);
  useEffect(() => { const id = requestAnimationFrame(() => onReady()); return () => cancelAnimationFrame(id); }, [onReady]);
  return (
    <>
      <color attach="background" args={['#14110e']} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#ffe6c0', '#2a1d12', 0.6]} />
      <directionalLight position={[30, 70, 40]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} />
      <pointLight position={[-40, 18, 20]} intensity={600} color="#ffb85a" distance={120} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}><planeGeometry args={[160, 110]} /><meshStandardMaterial color="#6b4428" roughness={0.85} /></mesh>
      <Mine s={s} nodes={nodes} />
      <Bateia s={s} nodes={nodes} />
    </>
  );
}

export default function Table3D({ s }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="gm-3d">
      {!ready && <div className="gm-3d-wait">Montando a mesa…</div>}
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 38, position: [4, 34, 30], near: 0.5, far: 600 }}>
        <Scene s={s} onReady={() => setReady(true)} />
        <OrbitControls target={[4, 0, 2]} maxPolarAngle={Math.PI / 2.15} minDistance={12} maxDistance={220} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL);
