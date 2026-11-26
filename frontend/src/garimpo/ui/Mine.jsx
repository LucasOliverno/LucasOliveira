// Tabuleiro da mina (SVG). No mapa explorado: peças quadradas com várias salas, túneis por dentro e
// saídas no meio das bordas, que continuam na peça vizinha. No mapa clássico: o corte em níveis.
import { useRef, useState } from 'react';
import * as E from '../engine.js';
import { RELICS, LEVELS } from '../data.js';
import { ROOM_COLOR, ROOM_GLYPH, PLAYER_HEX, roomLabel } from './text.js';

const U = 58; // tamanho de uma "subcasa" (a peça tem 3×3)
const TILE = U * 3;
const RR = 21; // raio da sala
const SHORT = { boca: 'Boca', barracao: 'Barracão', entrada: 'Entrada', vazia: 'Galeria', respiro: 'Respiro', geodo: 'Geodo', veio: 'Veio', eco: 'Eco', capela: 'Capela', deposito: 'Depósito', mascate: 'Mascate', elevador: 'Elevador', altar: 'Altar', ninho: 'Ninho', covil: 'Portão', canil: 'Canil', estatuas: 'Estátuas', espelhos: 'Espelhos', pedreira: 'Pedreira' };

function edgeStyle(e) {
  switch (e.type) {
    case 'dark': return { stroke: '#120f0c', w: 9, dash: '' };
    case 'rail': return { stroke: '#9a9a9a', w: 6, dash: '', rail: true };
    case 'ramp': return { stroke: '#8a6a3a', w: 7, dash: '', arrow: true };
    case 'lad': return { stroke: '#a0703a', w: 6, dash: '3 3' };
    case 'shaft': return { stroke: '#2f5d7c', w: 5, dash: '2 5' };
    case 'elev': return { stroke: '#4f7fa0', w: 3, dash: '10 6' };
    default: return { stroke: '#8a5a32', w: 8, dash: '' };
  }
}

function useCosts(s, you, myTurn) {
  const me = s.players[you];
  const reach = new Set(); const costs = {};
  if (myTurn && me && E.inMine(me) && me.t && !me.t.tired) {
    for (const { to } of E.neighbors(s, me.node)) {
      const c = E.moveCost(s, me, me.node, to);
      if (!c.err) { costs[to] = c; if (c.luz <= me.t.luz && c.prosa <= me.t.prosa) reach.add(to); }
    }
  }
  return { me, reach, costs };
}

function Room({ s, n, p, you, me, reach, rides, picking, onMove, onPickNode, onInfo, r = RR }) {
  const kind = s.map.nodes[n].kind || 'vazia';
  const canMove = reach.has(n) || rides[n];
  const cls = `gm-room${canMove ? ' can' : ''}${picking ? ' pick' : ''}${me?.node === n ? ' here' : ''}${kind === 'boca' ? ' boca' : ''}`;
  const onClick = picking ? () => onPickNode(n) : rides[n] && !reach.has(n) ? () => onMove(n, true) : canMove ? () => onMove(n) : () => onInfo?.({ room: n, pinned: true });
  const relic = s.relics[n];
  const pl = s.players.filter((q) => q.node === n && E.inMine(q));
  return (
    <g className={cls} onClick={onClick} onMouseEnter={() => onInfo?.({ room: n })} onMouseLeave={() => onInfo?.(null)}>
      <circle cx={p.x} cy={p.y} r={r} fill={ROOM_COLOR[kind] || '#5b4a3a'} />
      <circle cx={p.x} cy={p.y} r={r - 4} fill="url(#gm-roomshade)" pointerEvents="none" />
      <text x={p.x} y={p.y + 6} textAnchor="middle" className="gm-glyph big">{ROOM_GLYPH[kind] || '⛏'}</text>
      <text x={p.x} y={p.y + r + 11} textAnchor="middle" className="gm-roomlbl">{SHORT[kind] || roomLabel(kind)}</text>
      {relic && <g><circle cx={p.x + r * 0.8} cy={p.y - r * 0.75} r="9" fill="#e8b53a" stroke="#1a1714" /><text x={p.x + r * 0.8} y={p.y - r * 0.75 + 3.5} textAnchor="middle" className="gm-relic">{RELICS[relic].pts}</text></g>}
      {s.crystals[n] > 0 && <text x={p.x - r} y={p.y + r + 2} className="gm-small">💠{s.crystals[n]}</text>}
      {s.grisu.includes(n) && <text x={p.x + r * 0.4} y={p.y + r + 4} className="gm-small">☁️</text>}
      {s.cerb?.node === n && <text x={p.x - r - 6} y={p.y - r + 2} className="gm-boss">🐕{'·'.repeat(s.cerb.awake)}</text>}
      {s.medusa?.node === n && <text x={p.x - r - 6} y={p.y - r + 2} className="gm-boss">🐍</text>}
      {pl.map((q, k) => <circle key={q.id} cx={p.x - 10 + k * 7} cy={p.y + 9} r="6" fill={PLAYER_HEX[q.color]} stroke={q.id === you ? '#fff' : '#1a1714'} strokeWidth="2" />)}
    </g>
  );
}

function TileMine({ s, you, myTurn, onMove, onExplore, onPickNode, pickNodes, rideTo, onInfo }) {
  const { me, reach } = useCosts(s, you, myTurn);
  const rides = rideTo || {};
  const tiles = Object.entries(s.map.tiles).map(([k, t]) => ({ k, t, tx: Number(k.split(',')[0]), ty: Number(k.split(',')[1]) }));
  // área: peças existentes + uma margem curta (as saídas para o escuro ficam na borda)
  const xs = tiles.map((t) => t.tx); const ys = tiles.map((t) => t.ty);
  const MG = 0.4;
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const W = (maxX - minX + 1 + 2 * MG) * TILE; const H = (maxY - minY + 1 + 2 * MG) * TILE;
  const ox = (tx) => (tx - minX + MG) * TILE; const oy = (ty) => (ty - minY + MG) * TILE;
  const pos = (n) => { const nd = s.map.nodes[n]; return { x: (nd.x - minX * 3) * U + U / 2 + MG * TILE, y: (nd.y - minY * 3) * U + U / 2 + MG * TILE }; };
  // zoom e arrasto
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState([0, 0]);
  const drag = useRef(null);
  const vw = W / zoom; const vh = H / zoom;
  const vx = Math.min(Math.max(W / 2 - vw / 2 + pan[0], 0), W - vw); const vy = Math.min(Math.max(H / 2 - vh / 2 + pan[1], 0), H - vh);
  const onWheel = (e) => { const z = Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); setZoom(z); if (z === 1) setPan([0, 0]); };
  const onDown = (e) => { if (zoom > 1) drag.current = { x: e.clientX, y: e.clientY, pan, moved: false }; };
  const onMoveP = (e) => {
    const d = drag.current; if (!d) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = vw / r.width;
    const dx = (e.clientX - d.x) * k; const dy = (e.clientY - d.y) * k;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    setPan([d.pan[0] - dx, d.pan[1] - dy]);
  };
  const onUp = () => { drag.current = null; };
  const MID = { N: [TILE / 2, 0], S: [TILE / 2, TILE], E: [TILE, TILE / 2], W: [0, TILE / 2] };
  return (
    <div className="gm-minewrap">
    <div className="gm-zoom">
      <button type="button" onClick={() => setZoom((z) => Math.min(4, z * 1.3))} title="Aproximar">+</button>
      <button type="button" onClick={() => { const z = Math.max(1, zoom / 1.3); setZoom(z); if (z === 1) setPan([0, 0]); }} title="Afastar">−</button>
      <button type="button" onClick={() => { setZoom(1); setPan([0, 0]); }} title="Mostrar a mina inteira">Ajustar</button>
    </div>
    <svg className={`gm-mine tiles${zoom > 1 ? ' zoomed' : ''}`} viewBox={`${vx} ${vy} ${vw} ${vh}`} role="img" aria-label="Mina explorada"
      onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMoveP} onPointerUp={onUp} onPointerLeave={onUp}>
      <defs>
        <pattern id="gm-rock2" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#1d1813" /><circle cx="7" cy="9" r="2.4" fill="#262019" /><circle cx="21" cy="20" r="3" fill="#231d17" />
        </pattern>
        <radialGradient id="gm-roomshade" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#fff" stopOpacity="0.18" /><stop offset="1" stopColor="#000" stopOpacity="0.28" /></radialGradient>
        <marker id="gm-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e0b070" /></marker>
      </defs>
      <rect width={W} height={H} fill="url(#gm-rock2)" />
      {tiles.map(({ k, t, tx, ty }) => (
        <g key={k}>
          <rect x={ox(tx) + 3} y={oy(ty) + 3} width={TILE - 6} height={TILE - 6} rx="14" className={`gm-tile ${t.zone}${tx === 0 && ty === 0 ? ' start' : ''}`} />
          {tx === 0 && ty === 0 && <text x={ox(tx) + TILE / 2} y={oy(ty) + 16} textAnchor="middle" className="gm-tiletag">BOCA DA MINA</text>}
        </g>
      ))}
      {s.map.edges.map((e) => {
        if (e.type === 'elev') return null;
        const a = pos(e.a); const b = pos(e.b); const st = edgeStyle(e);
        const blocked = s.rubble.includes(e.key);
        const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
        return (
          <g key={e.key} className="gm-edge" onMouseEnter={() => onInfo?.({ edge: e.key })} onMouseLeave={() => onInfo?.(null)}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="18" />
            {(e.type === 't' || e.type === 'ramp') && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3a2412" strokeWidth={st.w + 5} strokeLinecap="round" />}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.stroke} strokeWidth={st.w} strokeLinecap="round" markerEnd={st.arrow ? 'url(#gm-arrow)' : undefined} />
            {(e.type === 't' || e.type === 'ramp') && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b07a46" strokeWidth="1.5" strokeDasharray="3 7" />}
            {e.type === 'dark' && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3a2f26" strokeWidth="2" strokeDasharray="4 5" />}
            {st.rail && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4a3a2a" strokeWidth="2" strokeDasharray="2 6" />}
            {e.den && <text x={mx} y={my + 5} textAnchor="middle" className="gm-edgeicon">🐾</text>}
            {blocked && <text x={mx} y={my + 6} textAnchor="middle" className="gm-rubble">🪨</text>}
          </g>
        );
      })}
      {s.map.edges.filter((e) => e.type === 'elev').map((e) => {
        const b = pos(e.b);
        return <text key={e.key} x={b.x + RR} y={b.y - RR} className="gm-edgeicon" ><title>Elevador até a Boca (🤝2)</title>🛗</text>;
      })}
      {/* saídas para o escuro: túnel que vai da sala até o meio da borda */}
      {tiles.flatMap(({ k, t, tx, ty }) => Object.entries(t.edges).map(([side, ex]) => {
        const [mx, my] = MID[side];
        const x2 = ox(tx) + mx; const y2 = oy(ty) + my;
        const a = pos(ex.node);
        const st = E.stubs(s, ex.node).find((q) => q.dir === side);
        const blockedSide = !st && !s.map.edges.some((e) => (e.a === ex.node || e.b === ex.node) && s.map.nodes[e.a === ex.node ? e.b : e.a]?.tile !== k && e.type !== 'elev');
        const mine = st && myTurn && me?.node === ex.node && E.inMine(me);
        const c = mine ? E.exploreCost(s, me, side) : null;
        const ok = mine && !c.err && c.luz <= me.t.luz;
        const rubble = st?.pass.type === 'rubble';
        return (
          <g key={`${k}${side}`}>
            {(st || blockedSide) && <line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke={edgeStyle({ type: ex.type }).stroke} strokeWidth={edgeStyle({ type: ex.type }).w - 1} strokeLinecap="round" opacity={blockedSide ? 0.4 : 0.9} />}
            {st && (
              <g className={`gm-stub${ok ? ' can' : ''}${rubble ? ' rubble' : ''}`} onClick={ok ? () => onExplore(side) : () => onInfo?.({ stub: { node: ex.node, dir: side }, pinned: true })}
                onMouseEnter={() => onInfo?.({ stub: { node: ex.node, dir: side } })} onMouseLeave={() => onInfo?.(null)}>
                <circle cx={x2} cy={y2} r="11" />
                <text x={x2} y={y2 + 4} textAnchor="middle">{rubble ? '🪨' : '?'}</text>
              </g>
            )}
          </g>
        );
      }))}
      {E.nodeIds(s).map((n) => <Room key={n} s={s} n={n} p={pos(n)} you={you} me={me} reach={reach} rides={rides} picking={pickNodes?.includes(n)} onMove={onMove} onPickNode={onPickNode} onInfo={onInfo} r={s.map.nodes[n].kind === 'boca' ? RR + 5 : RR} />)}
    </svg>
    </div>
  );
}

// Mapa clássico (tutorial): corte lateral em níveis
const CW = 104; const CH = 84;
function ClassicMine({ s, you, myTurn, onMove, onPickNode, pickNodes, rideTo, onInfo }) {
  const { me, reach } = useCosts(s, you, myTurn);
  const rides = rideTo || {};
  const pos = (n) => { const nd = s.map.nodes[n]; return { x: 40 + nd.x * 0.8 * CW + CW / 2, y: 30 + nd.lv * CH + CH / 2 }; };
  const width = 80 + 9 * CW; const height = 60 + 6 * CH;
  return (
    <svg className="gm-mine" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mina em corte">
      <rect width={width} height={height} fill="#1d1813" />
      {LEVELS.map((name, lv) => <text key={lv} x="8" y={30 + lv * CH + 14} className="gm-lvl">{name}</text>)}
      {s.map.edges.map((e) => { const a = pos(e.a); const b = pos(e.b); const st = edgeStyle(e); return <line key={e.key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.rubble.includes(e.key) ? '#5a5550' : st.stroke} strokeWidth={st.w} strokeDasharray={st.dash} />; })}
      {E.nodeIds(s).map((n) => <Room key={n} s={s} n={n} p={pos(n)} you={you} me={me} reach={reach} rides={rides} picking={pickNodes?.includes(n)} onMove={onMove} onPickNode={onPickNode} onInfo={onInfo} r={22} />)}
    </svg>
  );
}

export default function Mine(props) {
  return props.s.map.tiles ? <TileMine {...props} /> : <ClassicMine {...props} />;
}
