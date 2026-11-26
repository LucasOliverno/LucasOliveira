// Mesa 3D do GARIMPO: a mina em peças deitada na mesa, com as salas montadas em miniatura,
// garimpeiros, relíquias, chefes e a Bateia. É jogável: clique numa sala com anel dourado para andar
// e num marcador dourado na borda para explorar.
// Usa os modelos v3 de public/garimpo/models/v3/<id>.glb (em cm, base no chão), ajustados ao tamanho da mesa;
// o que ainda não tem modelo continua em geometria simples.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as E from '../engine.js';
import { RELICS } from '../data.js';
import { ROOM_COLOR, PLAYER_HEX, roomLabel } from './text.js';

const V3 = (id) => `${import.meta.env.BASE_URL}garimpo/models/v3/${id}.glb?v=3`;
const V3_IDS = new Set(['bateia', 'board_altar', 'board_barracao', 'board_boca_mina', 'board_carrinho', 'board_elevador_gaiola', 'board_geodo', 'board_mascate', 'board_ninho', 'board_respiro', 'board_trilho', 'cerbero_cabeca', 'chefe_cerbero', 'chefe_mae_do_ouro', 'chefe_medusa', 'cristal', 'cubo_jogador', 'cubo_pedra', 'desabamento', 'estatua_garimpeiro', 'furia_marcador', 'furia_trilha', 'grisu', 'lampiao_mesa', 'peao_garimpeiro_urucum', 'peao_garimpeiro_anil', 'peao_garimpeiro_mata', 'peao_garimpeiro_ipe', 'pepita', 'reliquia_bateia', 'reliquia_coleira', 'reliquia_coroa', 'reliquia_escama', 'reliquia_ferradura', 'reliquia_lampiao', 'reliquia_sino', 'reliquia_topazio', 'reliquia_veu']);
const hasModel = (id) => V3_IDS.has(id);
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

// Modelo v3 pelo id. fit = maior medida horizontal desejada; size = [x, y, z] força cada eixo (para trilhos).
// tint troca a cor (cubos do jogador). Cada instância é uma cópia da cena carregada.
function Model({ id, fit = 1, size = null, tint = null, ...props }) {
  const { scene } = useGLTF(V3(id));
  const box = useMemo(() => new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()), [scene]);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      if (tint) { m.material = m.material.clone(); m.material.color = new THREE.Color(tint); }
    });
    return c;
  }, [scene, tint]);
  const scale = size ? [size[0] / Math.max(box.x, 1e-3), size[1] / Math.max(box.y, 1e-3), size[2] / Math.max(box.z, 1e-3)] : fit / Math.max(box.x, box.z, 1e-3);
  return <primitive object={obj} scale={scale} {...props} />;
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
function RoomProps({ kind, crystals, seed }) {
  switch (kind) {
    case 'boca': return <group><mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.7, 0.7, 0.06, 24]} />{M('#0a0806')}</mesh><Model id="board_boca_mina" fit={2.7} position={[0, 0, -0.2]} /></group>;
    case 'barracao': return <Model id="board_barracao" fit={2.5} rotation={[0, Math.PI, 0]} />;
    case 'mascate': return <Model id="board_mascate" fit={2.4} position={[0, 0, -0.1]} />;
    case 'respiro': return <group><mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.45, 0.75, 3.2, 16, 1, true]} /><meshBasicMaterial color="#fff2c0" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} /></mesh><Model id="board_respiro" fit={1.6} /></group>;
    case 'elevador': return <Model id="board_elevador_gaiola" fit={1.4} />;
    case 'altar': return <Model id="board_altar" fit={1.5} />;
    case 'estatuas': return <group><Model id="estatua_garimpeiro" fit={0.9} position={[-0.5, 0, 0]} rotation={[0, 0.5, 0]} /><Model id="estatua_garimpeiro" fit={0.8} position={[0.5, 0, -0.3]} rotation={[0, -0.7, 0]} /></group>;
    case 'geodo': return (
      <group>
        <Model id="board_geodo" fit={1.8} />
        {Array.from({ length: crystals }).map((_, i) => <Model key={i} id="cristal" fit={0.35} position={[Math.cos(i * 2.4 + seed) * 0.95, 0, Math.sin(i * 2.4 + seed) * 0.95]} />)}
      </group>
    );
    case 'veio': return (
      <group>
        <mesh castShadow position={[0, 0.35, -0.4]} rotation={[0.2, 0, 0]}><boxGeometry args={[1.9, 0.7, 0.4]} />{M('#5a524a')}</mesh>
        <mesh position={[0, 0.42, -0.19]} rotation={[0.2, 0, 0.3]}><boxGeometry args={[1.6, 0.08, 0.05]} /><meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} emissive="#6a4a08" /></mesh>
        <Model id="pepita" fit={0.55} position={[0.5, 0, 0.5]} />
        <Model id="pepita" fit={0.4} position={[-0.4, 0, 0.6]} rotation={[0, 1.2, 0]} />
      </group>
    );
    case 'ninho': return (
      <group>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.3, 32]} /><meshStandardMaterial color="#5a1a0a" emissive="#d2482b" emissiveIntensity={0.6} /></mesh>
        <Model id="board_ninho" fit={2.7} />
        <Model id="chefe_mae_do_ouro" fit={1.9} position={[0, 0.25, 0]} />
      </group>
    );
    case 'eco': return (
      <group>{[0.5, 0.8, 1.1].map((r, i) => <mesh key={i} position={[0, 0.08 + i * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.03, 6, 32]} /><meshStandardMaterial color="#c9a8e0" transparent opacity={0.7 - i * 0.18} /></mesh>)}<Rocks n={2} seed={seed} /></group>
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
          {hasModel(RELICS[relic].model) ? <Model id={RELICS[relic].model} fit={0.85} position={[0, -0.3, 0]} /> : <mesh castShadow><octahedronGeometry args={[0.38]} /><meshStandardMaterial color="#f0c040" metalness={0.8} roughness={0.25} emissive="#7a5208" emissiveIntensity={0.6} /></mesh>}
          <Label text={`✦${RELICS[relic].pts}`} position={[0, 0.7, 0]} width={1.2} color="#ffd970" />
        </group>
      )}
      {s.grisu.includes(n) && <Model id="grisu" fit={1.5} position={[0.6, 0.2, 0.5]} />}
      {(clickable || picking) && <Glow color={picking ? '#c8d65a' : '#e8b53a'} />}
      {here && <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.5, 1.62, 40]} /><meshBasicMaterial color="#ffffff" /></mesh>}
      <Label text={roomLabel(kind)} position={[0, 0.16, 1.75]} width={2.6} />
    </group>
  );
}

const TUN_COLOR = { dark: '#16110d', rail: '#5a4a3a', ramp: '#8a6a3a', t: '#7a5232' };
function Tunnel({ a, b, e, blocked }) {
  const mid = [(a[0] + b[0]) / 2, TOP + 0.02, (a[2] + b[2]) / 2];
  const len = Math.hypot(a[0] - b[0], a[2] - b[2]);
  const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const w = e.type === 'dark' ? 0.55 : 0.95;
  return (
    <group position={mid} rotation={[0, ang, 0]}>
      <mesh receiveShadow><boxGeometry args={[w, 0.06, len]} /><meshStandardMaterial color={TUN_COLOR[e.type] || TUN_COLOR.t} roughness={0.9} /></mesh>
      {e.type !== 'dark' && e.type !== 'rail' && [-1, 1].map((sd) => <mesh key={sd} position={[sd * (w / 2 + 0.06), 0.08, 0]} castShadow><boxGeometry args={[0.1, 0.16, len]} />{M(WOOD)}</mesh>)}
      {e.type === 'rail' && <Model id="board_trilho" size={[len, 0.18, 0.8]} position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} />}
      {e.type === 'ramp' && <mesh position={[0, 0.12, len * 0.15]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.28, 0.5, 3]} />{M('#e0b070')}</mesh>}
      {e.den && [-0.25, 0.25].map((z) => <mesh key={z} position={[z * 0.6, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.12, 10]} /><meshBasicMaterial color="#c8553a" /></mesh>)}
      {blocked && <Model id="desabamento" fit={1.3} position={[0, 0.03, 0]} />}
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
          <group key={p.id} position={[x + Math.cos(ang) * 0.95, TOP + 0.1, z + Math.sin(ang) * 0.95]}>
            <Model id={`peao_garimpeiro_${p.color}`} fit={1.0} rotation={[0, -ang + Math.PI / 2, 0]} />
            {p.id === you && <mesh position={[0, 2.5, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.18, 0.3, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>}
          </group>
        );
      })}
      {s.cerb && (() => { const [x, , z] = pos(s.cerb.node); return (
        <group position={[x - 0.9, TOP + 0.1, z - 0.6]}>
          <Model id="chefe_cerbero" fit={1.9} rotation={[0, 0.6, 0]} />
          {[0, 1, 2].map((h) => <Model key={h} id="cerbero_cabeca" fit={0.32} position={[(h - 1) * 0.4, 0, 1.05]} tint={h < s.cerb.awake ? '#d2482b' : '#6a5a40'} />)}
        </group>
      ); })()}
      {s.medusa && (() => { const [x, , z] = pos(s.medusa.node); return <Model id="chefe_medusa" fit={1.5} position={[x - 0.9, TOP + 0.1, z - 0.6]} rotation={[0, 0.5, 0]} />; })()}
    </group>
  );
}

function Bateia({ s, at }) {
  const cubes = [];
  for (let i = 0; i < Math.min(s.bag.stone, 30); i++) cubes.push({ k: `s${i}`, name: 'cubo_pedra', color: null });
  s.players.forEach((p) => { for (let i = 0; i < Math.min(s.bag.p[p.id], 20); i++) cubes.push({ k: `${p.id}-${i}`, name: 'cubo_jogador', color: PLAYER_HEX[p.color] }); });
  const R = 2.5;
  return (
    <group position={at}>
      <Model id="bateia" fit={R * 2.2} />
      {cubes.map((c, i) => {
        const a = i * 2.39996; const r = Math.min(R - 0.6, 0.25 + Math.sqrt(i) * 0.34);
        return <Model key={c.k} id={c.name} fit={0.3} tint={c.color} position={[Math.cos(a) * r, 0.3 + Math.floor(i / 45) * 0.3, Math.sin(a) * r]} rotation={[0, a, 0]} />;
      })}
      <Label text={`Bateia · ${s.bag.stone + s.bag.p.reduce((x, y) => x + y, 0)} cubos`} position={[0, 0.02, R + 0.9]} width={3.6} color="#f3ebdd" />
    </group>
  );
}

// Trilha da Fúria na mesa, com o marcador na casa atual
function FuryTrack({ s, at }) {
  const L = 6;
  const steps = 7;
  const x = -L / 2 + ((s.fury - 0.5) / steps) * L;
  return (
    <group position={at}>
      <Model id="furia_trilha" size={[L, 0.25, 1]} />
      <Model id="furia_marcador" fit={0.55} position={[x, 0.25, 0]} />
      <Label text={`Fúria: tira ${s.fury >= 1 ? [2, 2, 3, 3, 4, 4, 5][s.fury - 1] : 2} cubos`} position={[0, 0.02, 1.1]} width={2.8} color="#ffb070" />
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
  useGLTF(V3('peao_garimpeiro_urucum')); // a cena espera os modelos carregarem
  const nodes = null;
  useEffect(() => { const id = requestAnimationFrame(() => onReady()); return () => cancelAnimationFrame(id); }, [onReady]);
  const tiles = Object.keys(s.map.tiles).map((k) => k.split(',').map(Number));
  const xs = tiles.map(([x]) => x); const ys = tiles.map(([, y]) => y);
  const x0 = (Math.min(...xs) * 3 - 0.5) * SUB; const x1 = (Math.max(...xs) * 3 + 2.5) * SUB;
  const z0 = (Math.min(...ys) * 3 - 0.5) * SUB; const z1 = (Math.max(...ys) * 3 + 2.5) * SUB;
  const bag = [x1 + 4.2, 0, (z0 + z1) / 2 - 1.5];
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
      <FuryTrack s={s} at={[bag[0], 0, bag[2] + 4.6]} />
      <Model id="lampiao_mesa" fit={1.5} position={[bag[0] + 2.6, 0, bag[2] - 3.4]} />
      <pointLight position={[bag[0] + 2.6, 2.2, bag[2] - 3.4]} intensity={25} color="#ffb85a" distance={22} />
      <Frame bounds={[x0, z0, bag[0] + 3.5, Math.max(z1, bag[2] + 6)]} controls={controls} />
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
      <div className="gm-3d-help">Arraste para girar · botão direito para mover · roda do mouse aproxima onde está o ponteiro · clique nas salas com anel dourado para andar e nos marcadores dourados para explorar</div>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, position: [0, 40, 34], near: 0.5, far: 600 }} onPointerMissed={() => { document.body.style.cursor = ''; }}>
        <Scene s={s} onReady={() => setReady(true)} controls={controls} {...rest} />
        <OrbitControls ref={controls} makeDefault zoomToCursor screenSpacePanning={false} maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={220} enableDamping />
      </Canvas>
    </div>
  );
}

for (const id of V3_IDS) useGLTF.preload(V3(id));
