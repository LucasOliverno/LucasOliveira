// Mesa 3D do GARIMPO: a mina em peças deitada na mesa, com as salas montadas em miniatura,
// garimpeiros, relíquias, chefes e a Bateia. É jogável: clique numa sala com anel dourado para andar
// e num marcador dourado na borda para explorar.
// Usa os modelos de public/garimpo/models/garimpo.glb (em cm) pelo nome; o resto é geometria simples.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as E from '../engine.js';
import { RELICS } from '../data.js';
import { ROOM_COLOR, PLAYER_HEX, roomLabel } from './text.js';

const MODEL = `${import.meta.env.BASE_URL}garimpo/models/garimpo.glb?v=1`;
const SUB = 3.4; // cm entre salas dentro de uma peça (a peça tem 3×3)
const TOP = 0.7; // altura do tampo das peças

// ------------------------------------------------------------------ utilidades
const TEX = new Map();
function textTexture(text, color) {
  const key = `${text}|${color}`;
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,16,12,0.72)';
  if (g.roundRect) { g.beginPath(); g.roundRect(4, 8, 504, 80, 30); g.fill(); } else g.fillRect(4, 8, 504, 80);
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 52; g.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`;
  while (g.measureText(text).width > 470 && size > 20) { size -= 2; g.font = `700 ${size}px "Segoe UI", system-ui, sans-serif`; }
  g.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  TEX.set(key, t);
  return t;
}
function Label({ text, position, width = 2.6, color = '#f3ebdd' }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[width, width * 0.1875]} />
      <meshBasicMaterial map={textTexture(text, color)} transparent depthWrite={false} />
    </mesh>
  );
}
const M = (color, extra = {}) => <meshStandardMaterial color={color} roughness={0.8} {...extra} />;
function Piece({ nodes, name, color, ...props }) {
  const n = nodes[name];
  const mat = useMemo(() => (color && n ? new THREE.MeshStandardMaterial({ color, roughness: 0.7 }) : n?.material), [color, n]);
  if (!n) return null;
  return <mesh geometry={n.geometry} material={mat} castShadow receiveShadow {...props} />;
}

// ------------------------------------------------------------------ miniaturas das salas
const WOOD = '#6b4426'; const WOOD2 = '#8a5a32'; const STONE = '#77706a'; const GOLD = '#e0a826';
function Arch() { // escoramento de madeira
  return (
    <group>
      <mesh castShadow position={[-0.75, 0.45, -0.6]}><boxGeometry args={[0.16, 0.9, 0.16]} />{M(WOOD)}</mesh>
      <mesh castShadow position={[0.75, 0.45, -0.6]}><boxGeometry args={[0.16, 0.9, 0.16]} />{M(WOOD)}</mesh>
      <mesh castShadow position={[0, 0.92, -0.6]}><boxGeometry args={[1.7, 0.16, 0.18]} />{M(WOOD2)}</mesh>
    </group>
  );
}
function Rocks({ n = 3, seed = 1 }) {
  return Array.from({ length: n }).map((_, i) => {
    const a = seed * 1.7 + i * 2.1; const r = 0.75 + (i % 2) * 0.25;
    return <mesh key={i} castShadow position={[Math.cos(a) * r, 0.14, Math.sin(a) * r]} rotation={[a, a * 2, 0]}><dodecahedronGeometry args={[0.16 + (i % 3) * 0.05]} />{M(STONE)}</mesh>;
  });
}
function RoomProps({ kind, nodes, crystals, seed }) {
  switch (kind) {
    case 'boca': return (
      <group>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.7, 0.7, 0.06, 24]} />{M('#0a0806')}</mesh>
        {[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z], i) => <mesh key={i} castShadow position={[x * 0.9, 1.1, z * 0.9]} rotation={[z * 0.12, 0, -x * 0.12]}><boxGeometry args={[0.14, 2.2, 0.14]} />{M(WOOD)}</mesh>)}
        <mesh castShadow position={[0, 2.2, 0]}><boxGeometry args={[1.7, 0.14, 1.7]} />{M(WOOD2)}</mesh>
        <mesh castShadow position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.45, 0.07, 8, 24]} />{M('#3a3a3a', { metalness: 0.6 })}</mesh>
      </group>
    );
    case 'barracao': return (
      <group>
        <mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[1.5, 0.9, 1.1]} />{M(WOOD2)}</mesh>
        <mesh castShadow position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.15, 0.6, 4]} />{M('#5a3a22')}</mesh>
        <mesh position={[0.3, 0.35, 0.56]}><boxGeometry args={[0.35, 0.55, 0.04]} />{M('#2a1a10')}</mesh>
      </group>
    );
    case 'geodo': return (
      <group>
        <mesh castShadow position={[0, 0.3, 0]} scale={[1, 0.55, 1]}><sphereGeometry args={[0.85, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />{M('#4a4440')}</mesh>
        {Array.from({ length: Math.max(3, crystals * 2 + 2) }).map((_, i) => { const a = i * 1.3 + seed; return <mesh key={i} castShadow position={[Math.cos(a) * 0.4, 0.45, Math.sin(a) * 0.4]} rotation={[Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]}><coneGeometry args={[0.12, 0.7, 6]} /><meshStandardMaterial color="#7fd6c4" emissive="#2f8c7e" emissiveIntensity={0.6} transparent opacity={0.9} /></mesh>; })}
      </group>
    );
    case 'veio': return (
      <group>
        <mesh castShadow position={[0, 0.35, -0.4]} rotation={[0.2, 0, 0]}><boxGeometry args={[1.9, 0.7, 0.4]} />{M('#5a524a')}</mesh>
        <mesh position={[0, 0.42, -0.19]} rotation={[0.2, 0, 0.3]}><boxGeometry args={[1.6, 0.08, 0.05]} /><meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} emissive="#6a4a08" /></mesh>
        <Piece nodes={nodes} name="pepita" position={[0.5, 0.05, 0.5]} scale={0.6} />
        <Piece nodes={nodes} name="pepita" position={[-0.4, 0.05, 0.6]} scale={0.45} />
      </group>
    );
    case 'eco': return (
      <group>{[0.5, 0.8, 1.1].map((r, i) => <mesh key={i} position={[0, 0.08 + i * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.03, 6, 32]} /><meshStandardMaterial color="#c9a8e0" transparent opacity={0.7 - i * 0.18} /></mesh>)}<Rocks n={2} seed={seed} /></group>
    );
    case 'respiro': return (
      <group>
        <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.45, 0.75, 3.2, 16, 1, true]} /><meshBasicMaterial color="#fff2c0" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.75, 24]} /><meshBasicMaterial color="#fff2c0" transparent opacity={0.35} /></mesh>
        <Rocks n={2} seed={seed} />
      </group>
    );
    case 'capela': return (
      <group>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[1, 0.8, 1.2]} />{M('#b8a888')}</mesh>
        <mesh castShadow position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1.2]}><boxGeometry args={[0.72, 0.72, 1]} />{M('#7a4a2b')}</mesh>
        <mesh position={[0.65, 0.25, 0.5]}><cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />{M('#f3ebdd')}</mesh>
        <mesh position={[0.65, 0.55, 0.5]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ffb84a" /></mesh>
      </group>
    );
    case 'deposito': return (
      <group>
        <mesh castShadow position={[-0.4, 0.3, -0.2]}><boxGeometry args={[0.6, 0.6, 0.6]} />{M(WOOD2)}</mesh>
        <mesh castShadow position={[0.3, 0.25, -0.35]} rotation={[0, 0.4, 0]}><boxGeometry args={[0.5, 0.5, 0.5]} />{M(WOOD)}</mesh>
        <mesh castShadow position={[-0.15, 0.82, -0.2]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.42, 0.42, 0.42]} />{M('#9a6a3a')}</mesh>
        <mesh castShadow position={[0.55, 0.35, 0.45]}><cylinderGeometry args={[0.28, 0.25, 0.7, 14]} />{M('#5a3a22')}</mesh>
      </group>
    );
    case 'mascate': return (
      <group>
        <mesh castShadow position={[0, 0.3, -0.2]}><boxGeometry args={[1.6, 0.6, 0.6]} />{M(WOOD2)}</mesh>
        {[-0.75, 0.75].map((x) => <mesh key={x} castShadow position={[x, 0.75, -0.45]}><boxGeometry args={[0.08, 1.5, 0.08]} />{M(WOOD)}</mesh>)}
        <mesh castShadow position={[0, 1.45, -0.15]} rotation={[0.45, 0, 0]}><boxGeometry args={[1.8, 0.05, 0.9]} />{M('#c8553a')}</mesh>
        <mesh castShadow position={[-0.4, 0.7, -0.2]}><sphereGeometry args={[0.16, 10, 8]} />{M('#b07a3a', { metalness: 0.5 })}</mesh>
        <mesh castShadow position={[0.35, 0.72, -0.2]}><cylinderGeometry args={[0.12, 0.16, 0.25, 10]} />{M('#3e8c7e')}</mesh>
      </group>
    );
    case 'elevador': return (
      <group>
        <mesh castShadow position={[0, 0.7, 0]}><boxGeometry args={[1.1, 1.4, 1.1]} /><meshStandardMaterial color="#6a7a86" wireframe /></mesh>
        <mesh position={[0, 0.03, 0]}><boxGeometry args={[1.1, 0.06, 1.1]} />{M(WOOD)}</mesh>
        <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.3, 0.05, 8, 20]} />{M('#3a3a3a', { metalness: 0.6 })}</mesh>
      </group>
    );
    case 'altar': return <Piece nodes={nodes} name="board_altar" position={[0, 0, 0]} scale={0.55} />;
    case 'ninho': return (
      <group>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.25, 32]} /><meshStandardMaterial color="#5a1a0a" emissive="#d2482b" emissiveIntensity={0.7} /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} castShadow position={[0, 0.18 + i * 0.22, 0]} rotation={[-Math.PI / 2, 0, i]}><torusGeometry args={[0.85 - i * 0.22, 0.13, 10, 28]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} emissive="#7a2a08" emissiveIntensity={0.4} /></mesh>)}
        <mesh castShadow position={[0.25, 0.95, 0.1]}><coneGeometry args={[0.16, 0.4, 8]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} /></mesh>
      </group>
    );
    case 'covil': return (
      <group>
        <mesh castShadow position={[0, 0.8, -0.5]}><boxGeometry args={[1.8, 1.6, 0.2]} />{M('#8a6a2a', { metalness: 0.6, roughness: 0.4 })}</mesh>
        {[-0.5, 0, 0.5].map((x) => <mesh key={x} castShadow position={[x, 0.8, -0.38]}><cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />{M('#3a2a10', { metalness: 0.7 })}</mesh>)}
      </group>
    );
    case 'canil': return (
      <group rotation={[0, seed, 0]}>
        <mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 1.1, 8]} />{M('#efe4cc')}</mesh>
        {[-0.55, 0.55].map((x) => <mesh key={x} castShadow position={[x, 0.12, 0]}><sphereGeometry args={[0.13, 8, 6]} />{M('#efe4cc')}</mesh>)}
        <Rocks n={2} seed={seed} />
      </group>
    );
    case 'estatuas': return (
      <group>{[[-0.45, 0], [0.45, -0.3]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh castShadow position={[0, 0.5, 0]}><cylinderGeometry args={[0.18, 0.24, 1, 10]} />{M('#8c8577')}</mesh><mesh castShadow position={[0, 1.15, 0]}><sphereGeometry args={[0.18, 10, 8]} />{M('#8c8577')}</mesh></group>)}</group>
    );
    case 'espelhos': return (
      <group>{[-0.4, 0.4].map((x, i) => <mesh key={x} castShadow position={[x, 0.6, -0.4]} rotation={[0, (i ? -1 : 1) * 0.4, 0]}><boxGeometry args={[0.7, 1.1, 0.05]} /><meshStandardMaterial color="#c8a860" metalness={1} roughness={0.08} /></mesh>)}</group>
    );
    case 'pedreira': return (
      <group>{[[-0.4, 0, 0], [0.35, 0, -0.2], [0, 0.42, -0.1]].map(([x, y, z], i) => <mesh key={i} castShadow position={[x, y + 0.2, z]} rotation={[0, i, 0]}><boxGeometry args={[0.6, 0.4, 0.45]} />{M('#8a9a7a')}</mesh>)}</group>
    );
    default: return <group><Arch /><Rocks n={3} seed={seed} /></group>;
  }
}

// ------------------------------------------------------------------ peças, salas e túneis
function Glow({ r = 1.5, color = '#e8b53a' }) {
  const ref = useRef();
  useFrame((st) => { if (ref.current) ref.current.material.opacity = 0.45 + Math.sin(st.clock.elapsedTime * 4) * 0.25; });
  return <mesh ref={ref} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r, r + 0.28, 40]} /><meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} /></mesh>;
}

function Room({ s, n, nodes, pos, clickable, picking, here, onClick, hover, setHover, onInfo }) {
  const kind = s.map.nodes[n].kind || 'vazia';
  const seed = n.length + n.charCodeAt(n.length - 1);
  const relic = s.relics[n];
  return (
    <group position={pos}
      onClick={(e) => { e.stopPropagation(); if (clickable || picking) onClick(n); else onInfo?.({ room: n, pinned: true }); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(n); onInfo?.({ room: n }); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(null); onInfo?.(null); document.body.style.cursor = ''; }}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.45, 1.55, 0.14, 32]} />
        <meshStandardMaterial color={ROOM_COLOR[kind] || '#5b4a3a'} roughness={0.85} emissive={hover === n && (clickable || picking) ? '#4a3510' : '#000000'} />
      </mesh>
      <RoomProps kind={kind} nodes={nodes} crystals={s.crystals[n] || 0} seed={seed} />
      {relic && (
        <group position={[0, kind === 'altar' ? 1.25 : 0.4, 0]}>
          <mesh castShadow><octahedronGeometry args={[0.38]} /><meshStandardMaterial color="#f0c040" metalness={0.8} roughness={0.25} emissive="#7a5208" emissiveIntensity={0.6} /></mesh>
          <Label text={`✦${RELICS[relic].pts}`} position={[0, 0.7, 0]} width={1.2} color="#ffd970" />
        </group>
      )}
      {s.grisu.includes(n) && <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.95, 16, 12]} /><meshStandardMaterial color="#c8d65a" transparent opacity={0.32} depthWrite={false} /></mesh>}
      {(clickable || picking) && <Glow color={picking ? '#c8d65a' : '#e8b53a'} />}
      {here && <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.5, 1.62, 40]} /><meshBasicMaterial color="#ffffff" /></mesh>}
      <Label text={roomLabel(kind)} position={[0, 0.16, 1.75]} width={2.6} />
    </group>
  );
}

const TUN_COLOR = { dark: '#16110d', rail: '#5a4a3a', ramp: '#8a6a3a', t: '#7a5232' };
function Tunnel({ a, b, e, nodes, blocked }) {
  const mid = [(a[0] + b[0]) / 2, TOP + 0.02, (a[2] + b[2]) / 2];
  const len = Math.hypot(a[0] - b[0], a[2] - b[2]);
  const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const w = e.type === 'dark' ? 0.55 : 0.95;
  return (
    <group position={mid} rotation={[0, ang, 0]}>
      <mesh receiveShadow><boxGeometry args={[w, 0.06, len]} /><meshStandardMaterial color={TUN_COLOR[e.type] || TUN_COLOR.t} roughness={0.9} /></mesh>
      {e.type !== 'dark' && e.type !== 'rail' && [-1, 1].map((sd) => <mesh key={sd} position={[sd * (w / 2 + 0.06), 0.08, 0]} castShadow><boxGeometry args={[0.1, 0.16, len]} />{M(WOOD)}</mesh>)}
      {e.type === 'rail' && <Piece nodes={nodes} name="board_trilho" position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} scale={[len / 9, 1, 0.38]} />}
      {e.type === 'ramp' && <mesh position={[0, 0.12, len * 0.15]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.28, 0.5, 3]} />{M('#e0b070')}</mesh>}
      {e.den && [-0.25, 0.25].map((z) => <mesh key={z} position={[z * 0.6, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.12, 10]} /><meshBasicMaterial color="#c8553a" /></mesh>)}
      {blocked && [0, 1, 2, 3].map((i) => <mesh key={i} castShadow position={[(i % 2 - 0.5) * 0.4, 0.22 + Math.floor(i / 2) * 0.25, (i - 1.5) * 0.15]} rotation={[i, i * 2, 0]}><dodecahedronGeometry args={[0.24]} />{M('#6a6460')}</mesh>)}
    </group>
  );
}

function Stub({ p, side, ok, rubble, onClick, onHover }) {
  const ref = useRef();
  useFrame((st) => { if (ref.current && ok) ref.current.position.y = TOP + 0.6 + Math.sin(st.clock.elapsedTime * 3) * 0.12; });
  return (
    <group>
      <mesh ref={ref} position={[p[0], TOP + 0.6, p[2]]}
        onClick={(e) => { if (ok) { e.stopPropagation(); onClick(side); } }}
        onPointerOver={() => { onHover?.(true); if (ok) document.body.style.cursor = 'pointer'; }} onPointerOut={() => { onHover?.(false); document.body.style.cursor = ''; }}>
        <octahedronGeometry args={[0.45]} />
        <meshStandardMaterial color={rubble ? '#6a6460' : ok ? '#e8b53a' : '#5a4a3a'} emissive={ok ? '#7a5a10' : '#000000'} transparent opacity={ok ? 1 : 0.6} />
      </mesh>
      <Label text={rubble ? 'desabamento' : ok ? 'explorar' : '?'} position={[p[0], TOP + 0.05, p[2] + 0.9]} width={ok || rubble ? 2 : 0.9} color={ok ? '#ffd970' : '#c9b99a'} />
    </group>
  );
}

function Mine({ s, nodes, you, myTurn, rideTo, onMove, onExplore, pickNodes, onPickNode, onInfo }) {
  const [hover, setHover] = useState(null);
  const rides = rideTo || {};
  const ids = E.nodeIds(s);
  const pos = (n) => { const nd = s.map.nodes[n]; return [nd.x * SUB, TOP, nd.y * SUB]; };
  const me = s.players[you];
  const reach = new Set();
  if (myTurn && me && E.inMine(me) && me.t && !me.t.tired) {
    for (const { to } of E.neighbors(s, me.node)) { const c = E.moveCost(s, me, me.node, to); if (!c.err && c.luz <= me.t.luz && c.prosa <= me.t.prosa) reach.add(to); }
  }
  const tiles = Object.entries(s.map.tiles);
  const MID = { N: [1, 0, -0.5], S: [1, 0, 2.5], E: [2.5, 0, 1], W: [-0.5, 0, 1] };
  return (
    <group>
      {tiles.map(([k, t]) => {
        const [tx, ty] = k.split(',').map(Number);
        const start = tx === 0 && ty === 0;
        return (
          <RoundedBox key={k} args={[SUB * 3 - 0.25, TOP, SUB * 3 - 0.25]} radius={0.3} position={[(tx * 3 + 1) * SUB, TOP / 2, (ty * 3 + 1) * SUB]} receiveShadow castShadow>
            <meshStandardMaterial color={start ? '#6a5236' : t.zone === 'segura' ? '#544230' : '#33291f'} roughness={0.95} />
          </RoundedBox>
        );
      })}
      {s.map.edges.filter((e) => e.type !== 'elev').map((e) => <Tunnel key={e.key} a={pos(e.a)} b={pos(e.b)} e={e} nodes={nodes} blocked={s.rubble.includes(e.key)} />)}
      {tiles.flatMap(([k, t]) => {
        const [tx, ty] = k.split(',').map(Number);
        return Object.entries(t.edges).map(([side, ex]) => {
          const st = E.stubs(s, ex.node).find((q) => q.dir === side);
          if (!st) return null;
          const [mx, , mz] = MID[side];
          const p = [(tx * 3 + mx) * SUB, TOP, (ty * 3 + mz) * SUB];
          const mine = myTurn && me?.node === ex.node && E.inMine(me);
          const c = mine ? E.exploreCost(s, me, side) : null;
          const ok = !!(mine && !c.err && c.luz <= me.t.luz);
          return (
            <group key={`${k}${side}`}>
              <Tunnel a={pos(ex.node)} b={p} e={{ type: st.pass.type === 'rubble' ? 't' : st.pass.type, den: st.pass.den }} nodes={nodes} blocked={false} />
              <Stub p={p} side={side} ok={ok} rubble={st.pass.type === 'rubble'} onClick={onExplore} onHover={(on) => onInfo?.(on ? { stub: { node: ex.node, dir: side } } : null)} />
            </group>
          );
        });
      })}
      {ids.map((n) => <Room key={n} s={s} n={n} nodes={nodes} pos={pos(n)} clickable={reach.has(n) || !!rides[n]} picking={!!pickNodes?.includes(n)} here={me?.node === n}
        hover={hover} setHover={setHover} onInfo={onInfo} onClick={(id) => (pickNodes?.includes(id) ? onPickNode(id) : onMove(id, !reach.has(id) && !!rides[id]))} />)}
      {s.map.edges.filter((e) => e.type === 'elev').map((e) => { const b = pos(e.b); return <Label key={e.key} text="elevador até a Boca" position={[b[0], TOP + 0.2, b[2] - 1.9]} width={3} color="#9fd0e8" />; })}
      {s.players.filter(E.inMine).map((p) => {
        const here = s.players.filter((q) => E.inMine(q) && q.node === p.node);
        const k = here.indexOf(p);
        const [x, , z] = pos(p.node);
        const ang = (k / Math.max(1, here.length)) * Math.PI * 2 + 0.6;
        return (
          <group key={p.id} position={[x + Math.cos(ang) * 0.95, TOP + 0.12, z + Math.sin(ang) * 0.95]} scale={0.5}>
            <mesh castShadow position={[0, 1, 0]}><cylinderGeometry args={[0.45, 0.7, 2, 14]} />{M(PLAYER_HEX[p.color])}</mesh>
            <mesh castShadow position={[0, 2.35, 0]}><sphereGeometry args={[0.55, 14, 12]} />{M(PLAYER_HEX[p.color])}</mesh>
            <mesh castShadow position={[0, 2.8, 0]}><cylinderGeometry args={[0.62, 0.62, 0.14, 16]} />{M('#d8b040')}</mesh>
            {p.id === you && <mesh position={[0, 3.6, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.3, 0.5, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>}
          </group>
        );
      })}
      {s.cerb && (() => { const [x, , z] = pos(s.cerb.node); return <group position={[x - 1, TOP + 0.1, z - 0.4]} scale={0.55}><mesh castShadow position={[0, 0.7, 0]}><boxGeometry args={[2.4, 1.2, 1.2]} />{M('#7a5a2a')}</mesh>{[0, 1, 2].map((h) => <mesh key={h} castShadow position={[(h - 1) * 0.8, 1.7, 0.5]}><sphereGeometry args={[0.45, 12, 10]} /><meshStandardMaterial color={h < s.cerb.awake ? '#d2482b' : '#7a5a2a'} emissive={h < s.cerb.awake ? '#6a1a08' : '#000000'} /></mesh>)}</group>; })()}
      {s.medusa && (() => { const [x, , z] = pos(s.medusa.node); return <group position={[x - 1, TOP + 0.1, z - 0.4]} scale={0.6}><mesh castShadow position={[0, 1.1, 0]}><coneGeometry args={[0.7, 2.2, 12]} />{M('#3e8c7e')}</mesh><mesh castShadow position={[0, 2.4, 0]}><sphereGeometry args={[0.45, 12, 10]} />{M('#8fc0a8')}</mesh></group>; })()}
    </group>
  );
}

function Bateia({ s, nodes, at }) {
  const cubes = [];
  for (let i = 0; i < Math.min(s.bag.stone, 30); i++) cubes.push({ k: `s${i}`, name: 'cubo_pedra', color: null });
  s.players.forEach((p) => { for (let i = 0; i < Math.min(s.bag.p[p.id], 20); i++) cubes.push({ k: `${p.id}-${i}`, name: 'cubo_jogador', color: PLAYER_HEX[p.color] }); });
  const R = 3.6;
  return (
    <group position={at}>
      <mesh receiveShadow castShadow position={[0, 0.5, 0]}><cylinderGeometry args={[R + 0.5, R - 0.6, 1, 40, 1, true]} /><meshStandardMaterial color="#6b4a2a" roughness={0.55} side={THREE.DoubleSide} /></mesh>
      <mesh receiveShadow position={[0, 0.05, 0]}><cylinderGeometry args={[R - 0.6, R - 0.6, 0.1, 40]} />{M('#4a3018')}</mesh>
      {cubes.map((c, i) => {
        const a = i * 2.39996; const r = Math.min(R - 1.1, 0.35 + Math.sqrt(i) * 0.5);
        return <Piece key={c.k} nodes={nodes} name={c.name} color={c.color} position={[Math.cos(a) * r, 0.12 + Math.floor(i / 40) * 0.4, Math.sin(a) * r]} rotation={[0, a, 0]} scale={0.55} />;
      })}
      <Label text={`Bateia · ${s.bag.stone + s.bag.p.reduce((x, y) => x + y, 0)} cubos · Fúria ${s.fury}`} position={[0, 0.02, R + 1]} width={6} color="#f3ebdd" />
    </group>
  );
}

// Enquadra a câmera na mina quando ela cresce
function Frame({ bounds, controls }) {
  const { camera } = useThree();
  const key = bounds.map((v) => Math.round(v)).join(',');
  useEffect(() => {
    const [x0, z0, x1, z1] = bounds;
    const cx = (x0 + x1) / 2; const cz = (z0 + z1) / 2;
    const span = Math.max(x1 - x0, (z1 - z0) * 1.4, 22);
    camera.position.set(cx, span * 0.78, cz + span * 0.62);
    camera.lookAt(cx, 0, cz);
    if (controls.current) { controls.current.target.set(cx, 0, cz); controls.current.update(); }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Scene({ s, onReady, controls, ...rest }) {
  const { nodes } = useGLTF(MODEL);
  useEffect(() => { const id = requestAnimationFrame(() => onReady()); return () => cancelAnimationFrame(id); }, [onReady]);
  const tiles = Object.keys(s.map.tiles).map((k) => k.split(',').map(Number));
  const xs = tiles.map(([x]) => x); const ys = tiles.map(([, y]) => y);
  const x0 = (Math.min(...xs) * 3 - 0.5) * SUB; const x1 = (Math.max(...xs) * 3 + 2.5) * SUB;
  const z0 = (Math.min(...ys) * 3 - 0.5) * SUB; const z1 = (Math.max(...ys) * 3 + 2.5) * SUB;
  const bag = [x1 + 6, 0, (z0 + z1) / 2];
  return (
    <>
      <color attach="background" args={['#14110e']} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#ffe6c0', '#2a1d12', 0.55]} />
      <directionalLight position={[bag[0] - 20, 60, bag[2] + 30]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} />
      <pointLight position={[(x0 + x1) / 2, 14, (z0 + z1) / 2]} intensity={260} color="#ffb85a" distance={70} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2 + 6, -0.01, (z0 + z1) / 2]}><planeGeometry args={[260, 200]} /><meshStandardMaterial color="#5e3c22" roughness={0.88} /></mesh>
      <Mine s={s} nodes={nodes} {...rest} />
      <Bateia s={s} nodes={nodes} at={bag} />
      <Frame bounds={[x0, z0, bag[0] + 4, z1]} controls={controls} />
    </>
  );
}

export default function Table3D({ s, ...rest }) {
  const [ready, setReady] = useState(false);
  const controls = useRef();
  if (!s.map.tiles) return <div className="gm-3d"><div className="gm-3d-wait">A mesa 3D é do mapa explorado. No mapa clássico, use o Tabuleiro.</div></div>;
  return (
    <div className="gm-3d">
      {!ready && <div className="gm-3d-wait">Montando a mesa…</div>}
      <div className="gm-3d-help">Arraste para girar · roda do mouse para aproximar · clique nas salas com anel dourado para andar e nos marcadores dourados para explorar</div>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, position: [0, 40, 34], near: 0.5, far: 600 }} onPointerMissed={() => { document.body.style.cursor = ''; }}>
        <Scene s={s} onReady={() => setReady(true)} controls={controls} {...rest} />
        <OrbitControls ref={controls} makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={8} maxDistance={220} enableDamping />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL);
