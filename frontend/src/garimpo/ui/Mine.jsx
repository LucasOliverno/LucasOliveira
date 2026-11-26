// Mina em corte (SVG): salas, passagens, saídas para o escuro, garimpeiros, relíquias, chefes e água.
import * as E from '../engine.js';
import { RELICS, LEVELS } from '../data.js';
import { ROOM_COLOR, ROOM_GLYPH, PLAYER_HEX, roomLabel, roomDesc, relicName } from './text.js';

const CW = 104; const CH = 84; const RW = 86; const RH = 60;
const STUB = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };

function layout(s) {
  const ids = E.nodeIds(s);
  const xs = ids.map((n) => s.map.nodes[n].x);
  const minX = s.map.mode === 'explorar' ? -4 : Math.min(...xs);
  const maxX = s.map.mode === 'explorar' ? 4 : Math.max(...xs);
  const scale = s.map.mode === 'explorar' ? 1 : 8 / Math.max(1, maxX - minX);
  const pos = (n) => {
    const nd = s.map.nodes[n];
    return { x: 40 + ((nd.x - minX) * scale) * CW + CW / 2, y: 30 + nd.lv * CH + CH / 2 };
  };
  const width = 80 + (s.map.mode === 'explorar' ? 9 : 9) * CW;
  return { pos, width, height: 60 + 6 * CH };
}

function edgeStyle(e) {
  switch (e.type) {
    case 'dark': return { stroke: '#1a1714', dash: '6 4', w: 7 };
    case 'rail': return { stroke: '#8a8a8a', dash: '', w: 5, rail: true };
    case 'lad': return { stroke: '#a0703a', dash: '3 3', w: 6 };
    case 'shaft': return { stroke: '#2f5d7c', dash: '2 5', w: 5 };
    case 'elev': return { stroke: '#4f7fa0', dash: '10 4', w: 3 };
    default: return { stroke: '#7a4a2b', dash: '', w: 7 };
  }
}

export default function Mine({ s, you, myTurn, onMove, onExplore, onPickNode, pickNodes, rideTo }) {
  const { pos, width, height } = layout(s);
  const me = s.players[you];
  const reach = new Set();
  const costs = {};
  if (myTurn && me && E.inMine(me) && me.t) {
    for (const { to } of E.neighbors(s, me.node)) {
      const c = E.moveCost(s, me, me.node, to);
      if (!c.err) { costs[to] = c; if (c.luz <= me.t.luz && c.prosa <= me.t.prosa) reach.add(to); }
    }
  }
  const rides = rideTo || {};
  const water = s.water;
  const stubsOf = (n) => (s.map.mode === 'explorar' ? E.stubs(s, n) : []);
  return (
    <svg className="gm-mine" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mina em corte">
      <defs>
        <pattern id="gm-rock" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#2a221c" />
          <circle cx="6" cy="8" r="2" fill="#332a22" /><circle cx="18" cy="17" r="3" fill="#30271f" />
        </pattern>
        <linearGradient id="gm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#89b4c9" /><stop offset="1" stopColor="#c9d8b0" /></linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#gm-rock)" />
      <rect x="0" y="0" width={width} height={30 + CH * 0.62} fill="url(#gm-sky)" />
      {LEVELS.map((name, lv) => (
        <g key={lv}>
          {lv > 0 && <line x1="0" x2={width} y1={30 + lv * CH} y2={30 + lv * CH} stroke="#3a3028" strokeWidth="1" />}
          <text x="8" y={30 + lv * CH + 14} className="gm-lvl">{name}</text>
          {water !== null && lv >= water && <rect x="0" y={30 + lv * CH} width={width} height={CH} fill="#2f5d7c" opacity="0.38" />}
        </g>
      ))}
      {/* passagens */}
      {s.map.edges.map((e) => {
        const a = pos(e.a); const b = pos(e.b); const st = edgeStyle(e);
        const blocked = s.rubble.includes(e.key);
        const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
        return (
          <g key={e.key}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.stroke} strokeWidth={st.w} strokeDasharray={st.dash} strokeLinecap="round" opacity="0.95" />
            {st.rail && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4a3a2a" strokeWidth="2" strokeDasharray="2 6" />}
            {e.den && <text x={mx} y={my + 5} textAnchor="middle" className="gm-edgeicon">🐾</text>}
            {e.type === 'shaft' && <text x={mx + 8} y={my} className="gm-edgeicon">⇣</text>}
            {e.type === 'elev' && <text x={mx + 6} y={my} className="gm-edgeicon">🛗</text>}
            {blocked && <text x={mx} y={my + 6} textAnchor="middle" className="gm-rubble">🪨</text>}
          </g>
        );
      })}
      {/* salas */}
      {E.nodeIds(s).map((n) => {
        const nd = s.map.nodes[n]; const p = pos(n); const kind = nd.kind || 'vazia';
        const canMove = reach.has(n) || rides[n];
        const picking = pickNodes?.includes(n);
        const cls = `gm-room${canMove ? ' can' : ''}${picking ? ' pick' : ''}${me?.node === n ? ' here' : ''}`;
        const onClick = picking ? () => onPickNode(n) : rides[n] && !reach.has(n) ? () => onMove(n, true) : canMove ? () => onMove(n) : undefined;
        const relic = s.relics[n];
        const pl = s.players.filter((q) => q.node === n && E.inMine(q));
        const tip = `${roomLabel(kind)}${roomDesc(kind) ? ` — ${roomDesc(kind)}` : ''}${relic ? `\nRelíquia: ${relicName(relic)}` : ''}${costs[n] ? `\nIr: 🔦${costs[n].luz}${costs[n].prosa ? ` 🤝${costs[n].prosa}` : ''}${costs[n].den ? ' + Toca' : ''}` : ''}`;
        return (
          <g key={n} className={cls} onClick={onClick}>
            <title>{tip}</title>
            <rect x={p.x - RW / 2} y={p.y - RH / 2} width={RW} height={RH} rx="9" fill={ROOM_COLOR[kind] || '#5b4a3a'} />
            <text x={p.x - RW / 2 + 6} y={p.y - RH / 2 + 14} className="gm-roomname">{roomLabel(kind)}</text>
            <text x={p.x + RW / 2 - 6} y={p.y - RH / 2 + 15} textAnchor="end" className="gm-glyph">{ROOM_GLYPH[kind] || ''}</text>
            {relic && <g><circle cx={p.x - 24} cy={p.y + 12} r="11" fill="#e8b53a" stroke="#1a1714" /><text x={p.x - 24} y={p.y + 16} textAnchor="middle" className="gm-relic">{RELICS[relic].pts}</text></g>}
            {s.crystals[n] > 0 && <text x={p.x + 18} y={p.y + 18} className="gm-small">💠{s.crystals[n]}</text>}
            {s.grisu.includes(n) && <text x={p.x + 24} y={p.y - 2} className="gm-small">☁️</text>}
            {s.cerb?.node === n && <text x={p.x} y={p.y + 8} textAnchor="middle" className="gm-boss">🐕{'·'.repeat(s.cerb.awake)}</text>}
            {s.medusa?.node === n && <text x={p.x} y={p.y + 8} textAnchor="middle" className="gm-boss">🐍</text>}
            {pl.map((q, k) => (
              <g key={q.id}><circle cx={p.x - 26 + k * 17} cy={p.y - 6} r="8" fill={PLAYER_HEX[q.color]} stroke={q.id === you ? '#fff' : '#1a1714'} strokeWidth="2" /></g>
            ))}
          </g>
        );
      })}
      {/* saídas para o escuro */}
      {E.nodeIds(s).flatMap((n) => stubsOf(n).map((st) => {
        const p = pos(n); const [dx, dy] = STUB[st.dir];
        const x = p.x + dx * (RW / 2 + 9); const y = p.y + dy * (RH / 2 + 9);
        const mine = myTurn && me?.node === n && E.inMine(me);
        const c = mine ? E.exploreCost(s, me, st.dir) : null;
        const ok = mine && !c.err && c.luz <= me.t.luz;
        const rubble = st.pass.type === 'rubble';
        return (
          <g key={`${n}-${st.dir}`} className={`gm-stub${ok ? ' can' : ''}${rubble ? ' rubble' : ''}`} onClick={ok ? () => onExplore(st.dir) : undefined}>
            <title>{rubble ? 'Desabamento: limpe com ⛏3 ou Dinamite' : `Explorar ${({ L: 'à esquerda', R: 'à direita', U: 'para cima', D: 'para baixo' })[st.dir]}${c && !c.err ? ` (🔦${c.luz})` : ''}`}</title>
            <circle cx={x} cy={y} r="9" />
            <text x={x} y={y + 4} textAnchor="middle">{rubble ? '🪨' : '?'}</text>
          </g>
        );
      }))}
    </svg>
  );
}
