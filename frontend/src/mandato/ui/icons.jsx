import { Fragment } from 'react';

// Ícones do guia visual (11 §4): grossos, 2 cores, contorno 2 px Azul Tinta.
const INK = '#1B2A41';
const S = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };

const ICONS = {
  v: (<><circle cx="12" cy="12" r="9" fill="#E0A526" {...S} /><rect x="8.5" y="8.5" width="7" height="7" fill="#F3EBDD" {...S} strokeWidth="1.6" /></>),
  o: (<><path d="M4 20 14 10" {...S} strokeWidth="3" /><rect x="10" y="3" width="11" height="6" rx="1.5" transform="rotate(45 15.5 6)" fill="#C4533A" {...S} /></>),
  a: (<><rect x="3.5" y="9" width="17" height="11" rx="2" fill="#6B3F69" {...S} /><path d="M8.5 9V3.5h7V9" fill="#F3EBDD" {...S} /><path d="M9 14h6" stroke="#F3EBDD" strokeWidth="2" strokeLinecap="round" /></>),
  star: (<path d="m12 2.8 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1L3.2 9.3l6.1-.9z" fill="#E0A526" {...S} />),
  seal: (<><circle cx="12" cy="12" r="9" fill="#E0A526" {...S} /><circle cx="12" cy="12" r="5.5" fill="none" {...S} strokeWidth="1.5" /><path d="m12 8.5 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill={INK} /></>),
  appr: (<><circle cx="12" cy="12" r="9" fill="#E0A526" {...S} /><circle cx="9" cy="10" r="1.2" fill={INK} /><circle cx="15" cy="10" r="1.2" fill={INK} /><path d="M7.8 14c1 2.2 2.6 3 4.2 3s3.2-.8 4.2-3" fill="none" {...S} /></>),
  poll: (<path d="M7 18a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17 7.8 4.1 4.1 0 0 1 17 18z" fill="#9AA0A6" {...S} />),
  e: (<path d="M13.5 2.5 5 13.5h6l-1 8 9-11.5h-6z" fill="#F2D13B" {...S} />),
  w: (<path d="M12 2.8c3.4 4.4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.6-6.6 6-11z" fill="#5E9CC4" {...S} />),
  pop: (<><circle cx="8" cy="8" r="3" fill={INK} /><path d="M2.5 19c0-3.6 2.4-5.7 5.5-5.7s5.5 2.1 5.5 5.7z" fill={INK} /><circle cx="16.5" cy="9" r="2.6" fill="#1F6F78" {...S} strokeWidth="1.5" /><path d="M12.5 19.5c0-3 1.7-4.8 4-4.8s4.5 1.8 4.5 4.8z" fill="#1F6F78" {...S} strokeWidth="1.5" /></>),
  cube: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="#F3EBDD" {...S} /><circle cx="12" cy="12" r="3.6" fill="#C4533A" {...S} /></>),
  alert: (<><path d="M5.5 18.5v-5a6.5 6.5 0 0 1 13 0v5z" fill="#C4533A" {...S} /><path d="M3.5 18.5h17M12 2.5v2M3.8 6l1.6 1.4M20.2 6l-1.6 1.4" fill="none" {...S} /></>),
  tec: (<><circle cx="12" cy="12" r="6" fill="#1F6F78" {...S} /><circle cx="12" cy="12" r="2.2" fill="#F3EBDD" {...S} strokeWidth="1.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" {...S} /></>),
  ver: (<><circle cx="12" cy="12" r="9.2" fill="#F3EBDD" {...S} /><path d="M7 16.5C7 9 12 6.5 17 7c.4 5.5-2 9.5-8.5 9.7" fill="#8DAA7E" {...S} /><path d="M7 17c2.5-3 5-5 8-6.5" fill="none" {...S} strokeWidth="1.5" /></>),
  emp: (<><path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="#E0A526" {...S} /><circle cx="12" cy="12" r="3.4" fill="#F3EBDD" {...S} strokeWidth="1.5" /></>),
  sin: (<><path d="M12 2.5 20.2 7.2v9.6L12 21.5 3.8 16.8V7.2z" fill="#C4533A" {...S} /><path d="m8 9 8 6m0-6-8 6" stroke="#F3EBDD" strokeWidth="2.2" strokeLinecap="round" /></>),
  // zonas
  RES: (<><path d="M3.5 11 12 3.5 20.5 11" fill="none" {...S} /><path d="M5.5 10v10.5h13V10" fill="#E8C874" {...S} /><rect x="10" y="14" width="4" height="6.5" fill="#F3EBDD" {...S} strokeWidth="1.6" /></>),
  COM: (<><path d="M3 9.5 5 4h14l2 5.5z" fill="#5E9CC4" {...S} /><path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" fill="#F3EBDD" {...S} strokeWidth="1.6" /><path d="M5 12.5V20.5h14V12.5" fill="none" {...S} /></>),
  IND: (<><path d="M3.5 20.5V10l5.5 3.5V10l5.5 3.5V10l0 0V20.5z" fill="#C4533A" {...S} /><rect x="16.5" y="3.5" width="4" height="17" fill="#C4533A" {...S} /></>),
  INF: (<><path d="M10 2.5 4 12h5l-1 9 7-10.5h-5.2z" fill="#F2D13B" {...S} strokeWidth="1.8" /><path d="M18 11c1.8 2.2 3 3.6 3 5.2a3 3 0 0 1-6 0c0-1.600 1.200-3 3-5.2z" fill="#5E9CC4" {...S} strokeWidth="1.6" /></>),
  VER: (<path d="M5 19C3.500 9.500 10 4 20 4c.800 9.500-4.500 15-12 15" fill="#8DAA7E" {...S} />),
  SER: (<><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="#E07A6B" {...S} /><path d="M12 7.500v9M7.500 12h9" stroke="#F3EBDD" strokeWidth="3" strokeLinecap="round" /></>),
  MON: (<path d="m3 18.500 1.800-10 4.700 4.500L12 5l2.500 8 4.700-4.500 1.800 10z" fill="#C9A227" {...S} />),
};

const EMO = {
  '💰': 'v', '🔨': 'o', '🗳': 'a', '⭐': 'star', '🎖': 'seal', '😊': 'appr', '☁': 'poll', '⚡': 'e', '💧': 'w',
  '👥': 'pop', '🕵': 'cube', '🔔': 'alert', '🔧': 'tec', '🌿': 'ver', '💼': 'emp', '✊': 'sin',
};
const RE = /(💰|🔨|🗳️?|⭐|🎖️?|😊|☁️?|⚡|💧|👥|🕵️?|🔔|🔧|🌿|💼|✊)/gu;

export function Ico({ n, s = 16, title, className = '' }) {
  const g = ICONS[n];
  if (!g) return null;
  return (
    <svg className={`ico ${className}`} width={s} height={s} viewBox="0 0 24 24" role="img" aria-label={title || n} focusable="false">
      {title && <title>{title}</title>}
      {g}
    </svg>
  );
}

// Converte emojis do texto das cartas nos ícones do guia visual.
export function Rich({ t, s = 15 }) {
  if (!t) return null;
  const parts = String(t).split(RE);
  return (
    <>
      {parts.map((x, i) => {
        const k = EMO[x.replace(/️/g, '')];
        return k && i % 2 === 1 ? <Ico key={i} n={k} s={s} /> : <Fragment key={i}>{x}</Fragment>;
      })}
    </>
  );
}

// Glifos de terreno
export function TerrainGlyph({ id, s = 28, color = INK }) {
  const c = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const G = {
    litoral: <><path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0" {...c} /><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" {...c} /></>,
    montanha: <><path d="M2.500 20 9 7l4 7 2.500-4L21.500 20z" {...c} /><path d="m7.500 10 1.500 2 1.500-1" {...c} /></>,
    planicie: <><path d="M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 14c-2-1-4-1-5-3 2 0 4 1 5 3zM12 14c2-1 4-1 5-3-2 0-4 1-5 3z" {...c} /></>,
    deserto: <><circle cx="16" cy="7" r="3" {...c} /><path d="M2 20c3-5 6-5 9 0 2-3 5-4 9 0" {...c} /></>,
    floresta: <><path d="M12 3 6 12h3l-3 5h12l-3-5h3z" {...c} /><path d="M12 17v4" {...c} /></>,
    ilha: <><ellipse cx="12" cy="19" rx="8" ry="2.500" {...c} /><path d="M12 18V8M12 8c-3-3-6-2-7 0 3-1 5 0 7 0zM12 8c3-3 6-2 7 0-3-1-5 0-7 0z" {...c} /></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">{G[id]}</svg>;
}
