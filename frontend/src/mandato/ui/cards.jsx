import { CARDS, FACTIONS, LOT_OPTS, TERRAINS, ZONES } from '../data.js';
import { exploreCard } from '../engine.js';
import { Ico, Rich } from './icons.jsx';
import { HAS_ART, artUrl, bandFor, TYPE_BAND, costText, describeOps } from './cardutil.js';

// Emblema da Facção / da Meta (arte gerada; sem arte, cai no ícone SVG)
export function FacEmblem({ f, s = 28 }) {
  return HAS_ART.has(`F-${f}`) ? <img className="emb" src={artUrl(`F-${f}`)} width={s} height={s} alt="" draggable="false" /> : <Ico n={f} s={s} />;
}
export function GoalEmblem({ id, s = 32 }) {
  return HAS_ART.has(id) ? <img className="emb goal-emb" src={artUrl(id)} width={s} height={s} alt="" draggable="false" /> : null;
}

// Fallback de arte: maquete isométrica com a cor da Zona (ou do tipo).
function Art({ card }) {
  const z = card.zones && card.zones[0];
  const col = z ? ZONES[z].color : TYPE_BAND[card.type]?.bg || '#CFCABD';
  const dark = '#1B2A41';
  if (card.type === 'building' || card.type === 'wonder') {
    return (
      <svg viewBox="0 0 160 120" className="art-svg" aria-hidden="true">
        <ellipse cx="80" cy="96" rx="52" ry="14" fill="rgba(27,42,65,.14)" />
        <path d="M80 70 124 92 80 114 36 92z" fill={col} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
        <path d="M36 92v-26l44 22v26z" fill={col} stroke={dark} strokeWidth="2" strokeLinejoin="round" style={{ filter: 'brightness(.82)' }} />
        <path d="M124 92V66L80 88v26z" fill={col} stroke={dark} strokeWidth="2" strokeLinejoin="round" style={{ filter: 'brightness(.68)' }} />
        <path d="M80 44 124 66 80 88 36 66z" fill={col} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
        <g transform="translate(66 52) scale(1.2)"><Ico n={card.wonder ? 'MON' : z} s={24} /></g>
      </svg>
    );
  }
  if (card.type === 'admin' || card.type === 'basic' || card.type === 'standard') {
    const f = card.fac && card.fac[0];
    return (
      <svg viewBox="0 0 160 120" className="art-svg" aria-hidden="true">
        <rect width="160" height="120" fill="none" />
        <circle cx="80" cy="64" r="44" fill={f ? FACTIONS[f].color : col} opacity=".18" />
        <circle cx="80" cy="46" r="17" fill={dark} />
        <path d="M44 100c0-22 14-34 36-34s36 12 36 34z" fill={dark} />
        <path d="M70 68 80 82 90 68" fill="#F3EBDD" stroke={dark} strokeWidth="1.5" />
        {f && <g transform="translate(112 12)"><Ico n={f} s={30} /></g>}
        {card.type !== 'admin' && <g transform="translate(58 36) scale(1.8)"><rect x="-4" y="-4" width="0" height="0" /></g>}
      </svg>
    );
  }
  if (card.type === 'decree') {
    return (
      <svg viewBox="0 0 160 120" className="art-svg" aria-hidden="true">
        <rect x="38" y="12" width="84" height="98" rx="4" fill="#F3EBDD" stroke={dark} strokeWidth="2" transform="rotate(-4 80 60)" />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M52 ${34 + i * 13}h56`} stroke={dark} strokeWidth="2" opacity=".5" transform="rotate(-4 80 60)" />)}
        <circle cx="104" cy="92" r="16" fill="#C4533A" stroke={dark} strokeWidth="2" /><path d="m104 82 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#F3EBDD" />
      </svg>
    );
  }
  if (card.type === 'intrigue') {
    return (
      <svg viewBox="0 0 160 120" className="art-svg" aria-hidden="true">
        <rect x="26" y="30" width="108" height="68" rx="6" fill="#6B3F69" stroke={dark} strokeWidth="2" />
        <path d="m28 34 52 36 52-36" fill="none" stroke="#F3EBDD" strokeWidth="3" strokeLinejoin="round" />
        <g transform="translate(112 12) rotate(14)"><Ico n="cube" s={30} /></g>
      </svg>
    );
  }
  return null;
}

function StatStrip({ card }) {
  if (card.type !== 'building' && card.type !== 'wonder') return null;
  const c = card.lot ? null : card;
  if (!c) {
    return <div className="cstrip"><span className="cs">Ob 🔨1–2</span><span className="cs">Zona à escolha</span></div>;
  }
  return (
    <div className="cstrip">
      <span className="cs"><b>Ob</b> <Rich t={`🔨${c.obra}`} s={13} /></span>
      {c.cons && (c.cons.e || c.cons.w) ? <span className="cs"><b>Cons</b> <Rich t={`${c.cons.e ? `⚡${c.cons.e}` : ''}${c.cons.w ? `💧${c.cons.w}` : ''}`} s={13} /></span> : null}
      {c.req || c.buildReq ? <span className="cs"><b>Req</b> <Rich t={`👥${c.req || c.buildReq.pop || ''}`} s={13} /></span> : null}
      {c.poll ? <span className="cs"><Rich t={`☁️${c.poll > 0 ? '' : ''}${c.poll}`} s={13} /></span> : null}
    </div>
  );
}

export function CostChip({ cost }) {
  const t = costText(cost);
  return t ? <Rich t={t} s={14} /> : null;
}

// Carta no estilo do guia visual (63×88). size: 'md' | 'sm'
export function Card({ id, size = 'md', selected, disabled, onClick, footer, tag, costOverride, instance, title, dim }) {
  const card = CARDS[id];
  if (!card) return null;
  const eff = instance && instance.v ? { ...card, ...LOT_OPTS[instance.v], zones: [LOT_OPTS[instance.v].zone] } : card;
  const band = bandFor(eff);
  const cost = costOverride || card.cost;
  const zoneGlyph = eff.zones ? eff.zones[0] : null;
  const body = card.lot && !instance ? 'Edificação genérica. Ao construir, escolha a Zona: RES, COM, IND ou INF.' : (instance && instance.v ? LOT_OPTS[instance.v].t : card.t);
  return (
    <button
      type="button"
      className={`card c-${card.type} sz-${size}${selected ? ' is-sel' : ''}${disabled ? ' is-off' : ''}${dim ? ' is-dim' : ''}${card.alert ? ' has-alert' : ''}${card.corrupt ? ' is-corrupt' : ''}`}
      onClick={onClick}
      aria-pressed={selected || undefined}
      title={title}
      style={{ '--band': band.bg, '--bandfg': band.fg }}
    >
      <span className="c-band">
        {zoneGlyph && <Ico n={zoneGlyph} s={size === 'sm' ? 15 : 18} />}
        <span className="c-name">{eff.name || card.name}</span>
        {cost && Object.keys(cost).length > 0 && <span className="c-cost"><CostChip cost={cost} /></span>}
      </span>
      <span className={`c-art${card.type === 'admin' || card.type === 'intrigue' ? ' c-art-sq' : ''}`}>
        {HAS_ART.has(id) ? <img src={artUrl(id)} alt="" loading="lazy" draggable="false" /> : <Art card={eff} />}
        {card.fac && card.fac.length > 0 && <span className="c-fac">{card.fac.map((f) => <Ico key={f} n={f} s={size === 'sm' ? 16 : 20} title={FACTIONS[f].name} />)}</span>}
        {card.alert && <span className="c-alert" title="🔔 Alerta: dispara uma Fiscalização ao entrar na Fila Especial"><Ico n="alert" s={size === 'sm' ? 15 : 18} /></span>}
      </span>
      {size !== 'sm' && <StatStrip card={instance && instance.v ? { ...eff, lot: false } : card} />}
      {size !== 'sm' && (
        <span className="c-text">
          <Rich t={body} />
          {card.penalty && <em className="c-pen"><Rich t={card.penalty} /></em>}
        </span>
      )}
      {size === 'sm' && body && <span className="c-text c-text-sm"><Rich t={body} s={12} /></span>}
      <span className="c-foot">
        <span>{card.id} · {band.label}{card.tier ? ` · T${['I', 'II', 'III'][card.tier - 1]}` : ''}</span>
        {card.merit ? <span className="c-merit"><Ico n="star" s={13} />{card.merit}</span> : null}
        {tag}
      </span>
      {footer && <span className="c-extra">{footer}</span>}
    </button>
  );
}

// Carta de Exploração (paisagem)
export function ExploreCard({ id, onClick, selected }) {
  const c = exploreCard(id);
  const tid = id.split('-')[1];
  const key = { LIT: 'litoral', MON: 'montanha', PLA: 'planicie', DES: 'deserto', FLO: 'floresta', ILH: 'ilha' }[tid];
  const color = TERRAINS[key].color;
  const lines = c.type === 'Sítio' ? [`Receba: ${CARDS[c.ops[0].id].name}`, CARDS[c.ops[0].id].t] : null;
  const art = HAS_ART.has(id) ? artUrl(id) : null;
  return (
    <button type="button" className={`xcard${selected ? ' is-sel' : ''}`} onClick={onClick} style={{ '--band': color }}>
      {art && <img className="xc-art" src={art} alt="" loading="lazy" draggable="false" />}
      <span className="xc-main">
        <span className="xc-top"><span className="xc-type">{c.type}</span><span className="xc-name">{c.name}</span></span>
        <span className="xc-body">
          {lines ? lines.map((l, i) => <span key={i}><Rich t={l} /></span>) : <span><Rich t={describeOps(c.ops)} /></span>}
        </span>
      </span>
    </button>
  );
}

