// Explicações na mesa: glossário de siglas, Saco e sorteio, Auditoria, deck, zoom de carta, Meta e tutorial.
import { useEffect, useState } from 'react';
import { CARDS, GOALS, ROUNDS, LOT_OPTS } from '../data.js';
import { GLOSSARY } from './explainData.js';
import * as E from '../engine.js';
import { Ico, Rich } from './icons.jsx';
import { Card, GoalEmblem } from './cards.jsx';
import { HAS_ART, artUrl, artIdFor } from './cardutil.js';


export function Glossary() {
  return (
    <dl className="gloss">
      {GLOSSARY.map(([k, v]) => (
        <div key={k} className="gloss-i"><dt><Rich t={k} s={14} /></dt><dd><Rich t={v} s={14} /></dd></div>
      ))}
    </dl>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-card explain${wide ? ' wide' : ''}`}>
        <button type="button" className="x close" onClick={onClose} aria-label="Fechar">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Saco
export function BagInfo({ s, onClose }) {
  const k = E.tension(s.round);
  return (
    <Modal title="O Saco da Fiscalização" onClose={onClose}>
      <p className="lead">O Partido fiscaliza as prefeituras. O Saco guarda cubos: <b>cinzas</b> são neutros, os <b>coloridos</b> são suspeitas contra cada prefeito.</p>
      <ul className="explain-list">
        <li><b>Como entram cubos seus:</b> cartas corruptas (Lobista, Contabilidade Criativa…), desmatar Floresta, algumas Intrigas e ter ⭐6 ou mais no fim de cada rodada.</li>
        <li><b>Quando sorteia:</b> sempre que uma carta com 🔔 entra na Fila Especial (e em alguns eventos). Saem <b>{k} cubos</b> nesta rodada (a Tensão sobe com o jogo: 3 → 6).</li>
        <li><b>O que acontece:</b> cada cubo seu sorteado volta para você e custa <b>1 😊</b>. Com <b>3 ou mais</b> no mesmo sorteio, Investigação: <b>−⭐1</b> e sem Metas na rodada.</li>
        <li><b>Como se proteger:</b> evite cartas corruptas, use cartas que removem 🕵️ (Ecóloga, Secretária de Meio Ambiente) e mantenha cubos neutros no Saco diluindo o sorteio.</li>
      </ul>
      <div className="bag-now">
        <span><i className="cube neutral" /> {s.bag.neutral} neutros</span>
        {s.players.map((p) => <span key={p.id}><i className="cube" style={{ background: p.color }} /> {p.cubesBag} de {p.name}</span>)}
      </div>
      {s.lastFisc && <p className="hint">Último sorteio: rodada {s.lastFisc.round} ({s.lastFisc.why}).</p>}
    </Modal>
  );
}

// Sorteio animado: os cubos saem um a um, depois o resultado de cada prefeito.
export function FiscReveal({ s, onClose }) {
  const f = s.lastFisc;
  if (!f) return null;
  const color = (id) => (id < 0 ? '#A9A89F' : s.players[id].color);
  const res = Object.entries(f.res || {});
  return (
    <Modal title="🔔 Fiscalização!" onClose={onClose}>
      <p className="lead"><Rich t={f.why} s={16} /> — sorteando {f.drawn.length} de {f.total} cubos do Saco.</p>
      <div className="draw-row" aria-label="Cubos sorteados">
        {f.drawn.map((id, i) => (
          <span key={i} className="draw-cube" style={{ '--c': color(id), animationDelay: `${i * 0.45}s` }} title={id < 0 ? 'neutro' : s.players[id].name}>
            {id < 0 ? '' : s.players[id].name.slice(0, 1)}
          </span>
        ))}
      </div>
      <div className="draw-res" style={{ animationDelay: `${f.drawn.length * 0.45 + 0.2}s` }}>
        {res.length === 0 && <p>Só cubos neutros: ninguém foi pego desta vez.</p>}
        {res.map(([pid, r]) => (
          <p key={pid}><i className="disc" style={{ background: s.players[pid].color }} /> <b>{s.players[pid].name}</b>: {r.h} cubo(s) sorteado(s) — perde {r.loss} 😊{r.invest ? ' e sofre Investigação (−⭐1)' : ''}.</p>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={onClose}>Ok</button>
    </Modal>
  );
}

// ---------------------------------------------------------------- Auditoria: quem lidera agora
export function AuditLeaders({ s }) {
  const rd = ROUNDS.find((r) => r.id === s.card);
  if (!rd || s.solo) return null;
  const vals = s.players.map((p) => ({ p, v: E.auditMetric(s, p) })).sort((a, b) => (rd.low ? a.v - b.v : b.v - a.v));
  return (
    <span className="audit-lead" title="No fim da rodada, o 1º ganha um Selo (2 Selos = ⭐1) e +💰1 no Tesouro; o 2º ganha +💰1.">
      {vals.map(({ p, v }, i) => (
        <span key={p.id} className={i === 0 ? 'first' : ''}><i className="disc sm" style={{ background: p.color }} />{v}</span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- deck e descarte
export function DeckView({ p, onClose }) {
  const group = (arr) => Object.entries(arr.reduce((m, id) => { if (id) m[id] = (m[id] || 0) + 1; return m; }, {}))
    .sort((a, b) => b[1] - a[1]);
  const all = [...p.deck, ...p.hand, ...p.discard].filter(Boolean);
  const known = all.length > 0;
  const deckIds = known ? group([...(p.deck.some((x) => x) ? p.deck : []), ...p.hand, ...p.discard]) : [];
  return (
    <Modal title={`Cartas de ${p.name}`} onClose={onClose} wide>
      <p className="lead">{p.deck.length} no deck (a ordem é segredo) · {p.hand.length} na mão · {p.discard.length} no descarte. Total: {p.deck.length + p.hand.length + p.discard.length}.</p>
      <h3 className="h">Descarte <small>já usadas; voltam ao deck quando ele acabar</small></h3>
      <div className="row">{group(p.discard).map(([id, n]) => <div key={id} className="stack"><Card id={id} size="sm" /><span className="stack-n">×{n}</span></div>)}{!p.discard.length && <p className="empty">Vazio.</p>}</div>
      {p.deck.some((x) => x) ? (
        <>
          <h3 className="h">Todas as suas cartas <small>deck + mão + descarte</small></h3>
          <div className="row">{deckIds.map(([id, n]) => <div key={id} className="stack"><Card id={id} size="sm" /><span className="stack-n">×{n}</span></div>)}</div>
        </>
      ) : <p className="hint">No online o servidor guarda a composição do seu deck; aqui aparecem as cartas já vistas (mão e descarte).</p>}
    </Modal>
  );
}

// ---------------------------------------------------------------- zoom de carta (olhinho)
export function CardZoom({ id, onClose }) {
  const c = CARDS[id];
  if (!c) return null;
  return (
    <Modal title={c.name} onClose={onClose}>
      <div className="zoom">
        <Card id={id} />
        {c.lot && (
          <div className="lot-opts">
            <p className="lab">Ao construir, escolha a Zona:</p>
            {Object.entries(LOT_OPTS).map(([k, o]) => (
              <div key={k} className="lot-opt">
                {HAS_ART.has(artIdFor(id, k)) && <img src={artUrl(artIdFor(id, k))} alt="" />}
                <span><b><Ico n={o.zone} s={16} /> {o.label}</b> · Ob 🔨{o.obra}<br /><Rich t={o.t} s={13} /></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Meta no inspetor
export function GoalDetail({ s, me, slot, myTurn, run, onDone }) {
  const sl = s.goals.slots[slot];
  if (!sl) return null;
  const g = GOALS.find((x) => x.id === sl.id);
  const ok = E.goalOk(s, me, sl.id);
  const who = (k) => (sl[k] === 'R' ? 'Rival' : sl[k] != null ? s.players[sl[k]].name : null);
  const avail = (sl.gold == null && sl.silver !== me.id) || (sl.silver == null && sl.gold !== me.id);
  const can = ok && avail && myTurn && !me.t.claimed && me.investRound !== s.round;
  return (
    <div className="goal-detail">
      <div className="gd-h"><GoalEmblem id={g.id} s={64} /><div><span className="gid">{g.id}</span> <b>{g.name}</b><br /><small>{g.cat} · dificuldade {'★'.repeat(g.d)}</small></div></div>
      <p className="gd-t"><Rich t={g.t} s={16} /></p>
      <p><b>Ouro (⭐2):</b> {who('gold') || 'livre'} · <b>Prata (⭐1):</b> {who('silver') || 'livre'}</p>
      <p className={ok ? 'g-ready' : 'hint'}>{ok ? '✔ Você cumpre esta Meta agora.' : 'Você ainda não cumpre esta Meta.'}</p>
      <p className="hint">Regra: no seu turno, reivindique 1 Meta que você cumpre. O 1º leva Ouro, o 2º leva Prata.</p>
      <button type="button" className="btn btn-primary" disabled={!can} onClick={() => { run({ t: 'claim', slot }); onDone(); }}>Reivindicar</button>
    </div>
  );
}

// ---------------------------------------------------------------- tutorial (tour guiado pela mesa)
const TOUR = [
  { sel: '.dock', title: 'Sua vez', text: 'Na sua vez você joga cartas da mão para ganhar recursos: 💰 Verba (comprar), 🔨 Obra (construir) e 🗳️ Articulação. O botão "Jogar recursos simples" joga todas as cartas básicas de uma vez.' },
  { sel: '.pane-side', title: 'Mercado', text: 'Gaste 💰 comprando cartas. Elas vão para o descarte e voltam na sua mão nos próximos turnos. Mercado Padrão está sempre disponível; a Fila Especial gira e traz cartas mais fortes; Seus Projetos Regionais são exclusivos do seu terreno.' },
  { sel: '.seat.mine', title: 'Sua cidade', text: 'Edificações na mão são construídas aqui: clique na carta, depois em "Construir" e numa casa destacada. Cada edifício rende todo turno, mas consome ⚡/💧 e alguns pedem população mínima (Req 👥).' },
  { sel: '.center', title: 'Metas e Facções', text: 'Metas dão ⭐2 ao 1º que cumprir e ⭐1 ao 2º (clique numa para ver o que pede). Cartas com ícone de Facção te avançam na trilha: chegar a 3 vale ⭐1.' },
  { sel: '.banner', title: 'Rodada, Evento e Auditoria', text: 'Cada rodada tem um Evento (regra só daquela rodada) e uma Auditoria: no fim, quem for melhor no critério ganha um Selo (2 Selos = ⭐1). Os números ao lado mostram quem lidera.' },
  { sel: '.bag', title: 'O Saco', text: 'Cartas corruptas põem cubos seus no Saco. Quando uma carta 🔔 entra na Fila, há sorteio: cubo seu sorteado custa 😊. Clique no Saco para entender tudo.' },
  { sel: '.topbar', title: 'Objetivo', text: 'A trilha de cima mostra o Mérito (⭐) de todos. Quem chegar a ⭐10 encerra o jogo no fim da rodada; senão, vence quem tiver mais ⭐ após 12 rodadas. Boa campanha, prefeito!' },
];

export function Coach({ onClose }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState(null);
  const step = TOUR[i];
  useEffect(() => {
    const place = () => {
      const el = document.querySelector(step.sel);
      setBox(el ? el.getBoundingClientRect() : null);
    };
    const h = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => { cancelAnimationFrame(h); window.removeEventListener('resize', place); };
  }, [step.sel]);
  const tipStyle = box
    ? { top: Math.min(window.innerHeight - 230, Math.max(12, box.top + box.height / 2 - 100)), left: box.left + box.width + 360 < window.innerWidth ? box.left + box.width + 16 : Math.max(12, box.left - 356) }
    : { top: '30%', left: 'calc(50% - 170px)' };
  if (box && box.width > window.innerWidth * 0.6) { tipStyle.left = 'calc(50% - 170px)'; tipStyle.top = box.top > window.innerHeight / 2 ? Math.max(12, box.top - 230) : Math.min(window.innerHeight - 230, box.bottom + 12); }
  return (
    <div className="coach" role="dialog" aria-label="Tutorial">
      {box && <div className="coach-hole" style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 }} />}
      <div className="coach-tip" style={tipStyle}>
        <small>Tutorial · {i + 1}/{TOUR.length}</small>
        <h3>{step.title}</h3>
        <p><Rich t={step.text} s={15} /></p>
        <div className="coach-acts">
          <button type="button" className="m-link" onClick={onClose}>Pular</button>
          {i > 0 && <button type="button" className="btn sm" onClick={() => setI(i - 1)}>Voltar</button>}
          {i < TOUR.length - 1
            ? <button type="button" className="btn btn-primary sm" onClick={() => setI(i + 1)}>Próximo</button>
            : <button type="button" className="btn btn-primary sm" onClick={onClose}>Começar a jogar</button>}
        </div>
      </div>
    </div>
  );
}

