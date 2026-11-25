import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, GOALS, ROUNDS, TERRAINS, LOT_OPTS, STANDARD, FACTIONS, FAC_KEYS, RIVAL, ZONES } from '../data.js';
import * as E from '../engine.js';
import { botStep } from '../bot.js';
import { Ico, Rich, TerrainGlyph } from './icons.jsx';
import { Card, ExploreCard, CostChip, FacEmblem, GoalEmblem } from './cards.jsx';
import { HAS_ART, artUrl } from './cardutil.js';
import { Chat } from './chat.jsx';
import { chime, sfx, loadMuted, saveMuted } from './sound.js';
import { useView, setView, VIEWS } from './viewpref.js';
const Table3D = lazy(() => import('./Table3D.jsx'));
import { PartyLeaders, PartyReveal, BagInfo, FiscReveal, AuditLeaders, DeckView, CardZoom, GoalDetail, Coach } from './explain.jsx';
import { REGIONAL_HOWTO } from './explainData.js';
import { City, MetersMini, ResPool, MeritTrack, TurnStrip, CenterBoard, CityMarks } from './board.jsx';
import { Draft, Curtain, Rules, GameOver } from './screens.jsx';

const SIMPLE = (id) => CARDS[id].type === 'basic' || id === 'P-02' || id === 'P-04';

// ---------------------------------------------------------------- Saco

function Bag({ s, onOpen }) {
  const shake = s.stats.fisc;
  const total = s.bag.neutral + s.players.reduce((a, p) => a + p.cubesBag, 0);
  return (
    <button type="button" className="bag" onClick={onOpen} title="O que é o Saco? Clique para entender">
      <svg key={shake} className={`bag-svg${shake ? ' shake' : ''}`} viewBox="0 0 48 52" width="40" height="44" aria-hidden="true">
        <path d="M14 8c2-4 18-4 20 0l-2 6H16z" fill="#CFCABD" stroke="#1B2A41" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 14C6 22 4 32 6 42c1 5 8 7 18 7s17-2 18-7c2-10 0-20-10-28z" fill="#E4D8BF" stroke="#1B2A41" strokeWidth="2" strokeLinejoin="round" />
        <rect x="14" y="26" width="20" height="10" rx="2" fill="#C4533A" opacity=".9" /><path d="M17 31h14" stroke="#F3EBDD" strokeWidth="2" />
      </svg>
      <div className="bag-t">
        <b>Saco · {total}</b>
        <span>
          <i className="cube neutral" /> {s.bag.neutral}
          {s.players.filter((p) => p.cubesBag > 0).map((p) => <span key={p.id} className="bag-p"><i className="cube" style={{ background: p.color }} /> {p.cubesBag}</span>)}
        </span>
        <small>Tensão {E.tension(s.round)}: sorteia {E.tension(s.round)} cubos · <u>o que é?</u></small>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- barra superior

function RoundBanner({ s, onBag }) {
  const rd = ROUNDS.find((r) => r.id === s.card);
  const [auHelp, setAuHelp] = useState(false);
  return (
    <div className="banner">
      <div className="b-round">
        <small>Rodada</small>
        <b>{s.round}<i>/{E.maxRounds(s)}</i></b>
        {s.finalRound && <span className="b-final">Rodada final</span>}
      </div>
      {rd && (
        <div className={`b-card${HAS_ART.has(rd.id) ? ' has-art' : ''}`}>
          {HAS_ART.has(rd.id) && <img className="b-art" src={artUrl(rd.id)} alt="" draggable="false" />}
          <div className="b-au"><span className="tagk au" title="No fim da rodada, o 1º nesse critério ganha um Selo (2 Selos = ⭐1) e +💰1; o 2º ganha +💰1">Auditoria</span><span><Rich t={rd.au} s={14} /></span><AuditLeaders s={s} />
            <button type="button" className="au-q" onClick={() => setAuHelp((v) => !v)} aria-expanded={auHelp} title="O que é a Auditoria?">?</button>
          {auHelp && (
            <div className="au-pop" role="dialog" aria-label="Como funciona a Auditoria">
              <b>Auditoria da rodada</b>
              <p>No <b>fim da rodada</b>, todos são comparados no critério desta carta (<Rich t={rd.au} s={13} />). Os números ao lado mostram quem lidera agora.</p>
              <ul>
                <li><b>1º lugar (sozinho):</b> ganha <b>1 Selo</b> 🎖️ e +💰1 no Tesouro.</li>
                <li><b>2º lugar</b> (3+ jogadores): +💰1 no Tesouro.</li>
                <li><b>Empate no 1º:</b> ninguém ganha Selo; com 3+ jogadores, cada empatado ganha +💰1.</li>
                <li><b>2 Selos = ⭐1</b> de Mérito (troca automática no fim da rodada). Seus Selos aparecem no painel da cidade (🎖️).</li>
              </ul>
              <button type="button" className="m-link" onClick={() => setAuHelp(false)}>fechar</button>
            </div>
          )}</div>
        </div>
      )}
      {E.hasMandates(s) && (
        <div className="b-party"><span className="tagk party" title="No fim de cada mandato o Partido avalia os prefeitos: 😊×2 + edifícios ativos. 1º ⭐2, 2º ⭐1.">Partido</span>
          <span>Mandato <b>{E.mandateOf(s)}/{E.mandateCount(s)}</b> · avaliação no fim da rodada {E.reviewRound(s)}</span><PartyLeaders s={s} /></div>
      )}
      <Bag s={s} onOpen={onBag} />
    </div>
  );
}

function CARGO(m) { return m >= 10 ? 'Ministro' : m >= 8 ? 'Governador' : m >= 6 ? 'Deputado' : m >= 4 ? 'Secretário' : m >= 2 ? 'Reeleito' : 'Novato'; }

// ---------------------------------------------------------------- Metas

function Goals({ s, me, myTurn, run }) {
  const T = TERRAINS[me.terrain];
  const regOk = E.regionalOk(s, me);
  const canClaim = myTurn && !me.t.claimed && me.investRound !== s.round;
  return (
    <div className="goals">
      <div className="g-note">Ouro ⭐2 para o 1º, Prata ⭐1 para o 2º. Máx. 1 Meta por turno{me.investRound === s.round ? ' — sob Investigação nesta rodada.' : '.'}</div>
      {s.goals.slots.map((sl, i) => {
        const g = GOALS.find((x) => x.id === sl.id);
        const ok = E.goalOk(s, me, sl.id);
        const slotTaken = (k) => (sl[k] === 'R' ? 'Rival' : sl[k] != null ? s.players[sl[k]].name : null);
        const gold = slotTaken('gold');
        const silver = slotTaken('silver');
        const avail = (sl.gold == null && sl.silver !== me.id) || (sl.silver == null && sl.gold !== me.id);
        return (
          <article key={sl.id + i} className={`goal${ok ? ' ready' : ''}`}>
            <header><GoalEmblem id={g.id} s={40} /><span className="gid">{g.id}</span><b>{g.name}</b><small>{g.cat} {'★'.repeat(g.d)}</small></header>
            <p><Rich t={g.t} s={14} /></p>
            <div className="medals">
              <span className={`medal gold${gold ? ' got' : ''}`}><Ico n="star" s={14} /> Ouro ⭐2 {gold ? `· ${gold}` : ''}</span>
              <span className={`medal silver${silver ? ' got' : ''}`}><Ico n="star" s={14} /> Prata ⭐1 {silver ? `· ${silver}` : ''}</span>
            </div>
            {ok && avail && <div className="g-ready">✔ Você cumpre agora</div>}
            <button type="button" className="btn sm" disabled={!(ok && avail && canClaim)} onClick={() => run({ t: 'claim', slot: i })}>Reivindicar</button>
          </article>
        );
      })}
      <article className={`goal regional${regOk && !me.regionalDone ? ' ready' : ''}`} style={{ '--tc': T.color }}>
        <header><span className="gid">REG</span><b>{T.regionalGoal.name}</b><small>Meta Regional · privada</small></header>
        <p><Rich t={T.regionalGoal.t} s={14} /></p>
        <p className="hint"><b>Como cumprir:</b> {REGIONAL_HOWTO[me.terrain]}</p>
        <div className="medals"><span className={`medal gold${me.regionalDone ? ' got' : ''}`}><Ico n="star" s={14} /> ⭐2 {me.regionalDone ? '· cumprida' : ''}</span></div>
        <button type="button" className="btn sm" disabled={!(regOk && !me.regionalDone && canClaim)} onClick={() => run({ t: 'claim', regional: true })}>Reivindicar</button>
      </article>
    </div>
  );
}

// ---------------------------------------------------------------- Diário

function Log({ s, viewer }) {
  const [f, setF] = useState('all');
  const ref = useRef(null);
  const lines = s.log.filter((l) => f === 'all' || (f === 'mine' && (l.pid === viewer || l.kind === 'round')) || (f === 'fisc' && (l.kind === 'fisc' || l.kind === 'cube' || l.kind === 'round')));
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines.length, f]);
  return (
    <div className="log">
      <div className="seg sm">
        {[['all', 'Tudo'], ['mine', 'Meu turno'], ['fisc', 'Fiscalizações']].map(([k, l]) => <button key={k} type="button" className={f === k ? 'on' : ''} onClick={() => setF(k)}>{l}</button>)}
      </div>
      <div className="log-list" ref={ref}>
        {lines.slice(-140).map((l, i) => <p key={i} className={`lg lg-${l.kind || 'n'}`}><Rich t={l.msg} s={14} /></p>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- decisões pendentes

function PendingModal({ s, pe, viewer, run }) {
  const p = s.players[pe.pid];
  const d = pe.data;
  const mine = pe.pid === viewer;
  let title = 'Decisão';
  let body = null;
  if (pe.kind === 'faction') {
    title = d.mode === 'intr04' ? 'Pressão Parlamentar: escolha a Facção' : 'Avance em uma Facção';
    body = (
      <div className="choices">
        {FAC_KEYS.map((f) => (
          <button type="button" key={f} className="choice" disabled={!mine || d.excl.includes(f)} onClick={() => run({ t: 'choose', f })} style={{ '--fc': FACTIONS[f].color }}>
            <FacEmblem f={f} s={46} /><b>{FACTIONS[f].name}</b><span>{p.fac[f]} → {Math.min(6, p.fac[f] + d.n)}</span>
          </button>
        ))}
      </div>
    );
  } else if (pe.kind === 'option') {
    title = 'Escolha um efeito';
    body = <div className="choices col">{d.options.map((o, i) => <button type="button" key={i} className="choice wide" disabled={!mine} onClick={() => run({ t: 'choose', i })}><Rich t={o.l} s={16} /></button>)}</div>;
  } else if (pe.kind === 'explore') {
    title = 'Explorar: resolva 1 carta (a outra vai ao fundo do deck)';
    body = <div className="choices">{d.cards.map((id, i) => <ExploreCard key={id} id={id} onClick={() => mine && run({ t: 'choose', i })} />)}</div>;
  } else if (pe.kind === 'hand') {
    title = d.mode === 'exile' ? 'Exile 1 carta da mão' : 'Descarte 1 carta da mão';
    body = <div className="choices hand">{p.hand.map((id, hi) => <Card key={hi} id={id} size="sm" onClick={() => mine && run({ t: 'choose', hi })} />)}</div>;
  } else if (pe.kind === 'pick') {
    title = 'Pacote de Posição: escolha 1 carta (vai ao descarte)';
    body = <div className="choices hand">{d.cards.map((id, i) => <Card key={id} id={id} onClick={() => mine && run({ t: 'choose', i })} />)}</div>;
  } else if (pe.kind === 'reaction') {
    title = `${p.name}: reagir a ${CARDS[d.card].name}?`;
    body = (
      <div className="choices col">
        <Card id={d.card} size="sm" />
        <p>Você tem <b>Contra-Inteligência</b> na mão: cancele a Intriga e compre 1 carta.</p>
        <button type="button" className="btn btn-primary" disabled={!mine} onClick={() => run({ t: 'choose', use: true })}>Usar Contra-Inteligência</button>
        <button type="button" className="btn btn-ghost" disabled={!mine} onClick={() => run({ t: 'choose', use: false })}>Deixar passar</button>
      </div>
    );
  } else if (pe.kind === 'tile') {
    const owner = s.players[d.owner];
    title = d.mode === 'desmate' ? 'Escolha uma Floresta para desmatar' : `Escolha o edifício de ${owner.name} que ficará inativo`;
    const validity = owner.tiles.map((_, i) => (d.tiles.includes(i) ? {} : { err: 'x' }));
    body = (
      <div className="tile-pick">
        <City s={s} p={owner} placing validity={validity} onTile={(i) => mine && run({ t: 'choose', tile: i })} interactive={mine} />
      </div>
    );
  }
  if (!mine && ['explore', 'pick', 'hand'].includes(pe.kind)) body = null; // informação privada de outro jogador
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card pend">
        <p className="pend-who"><i className="disc" style={{ background: p.color }} /> {p.name}</p>
        <h2>{title}</h2>
        {!mine && <p className="warn">Aguardando {p.name}.</p>}
        {body}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- mesa

export default function Game({ game, setGame, onExit, online, tutorial }) {
  const s = game;
  const humans = s.players.filter((p) => !p.bot);
  const act = E.actor(s);
  const [shown, setShown] = useState(humans[0].id);
  const [sel, setSel] = useState(null);
  const [placing, setPlacing] = useState(null);
  const [landKey, setLandKey] = useState(null); // modo "comprar terreno" vale só no turno em que foi aberto
  const [lot, setLot] = useState('RES');
  const [tab, setTab] = useState('mercado');
  const [mtab, setMtab] = useState('city');
  const [toast, setToast] = useState('');
  const [hover, setHover] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [centerOpen, setCenterOpen] = useState(() => { try { return localStorage.getItem('mandato:center') !== '0'; } catch { return true; } });
  const [muted, setMuted] = useState(loadMuted);
  const view = useView();
  const [seenChat, setSeenChat] = useState(0);
  const [hideOver, setHideOver] = useState(false);
  const [peek, setPeek] = useState(false); // ver a mão fora da sua vez
  const [bagOpen, setBagOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [coach, setCoach] = useState(!!tutorial);
  const [fiscSeen, setFiscSeen] = useState(() => (game.lastFisc ? game.lastFisc.id : 0));
  const [reviewSeen, setReviewSeen] = useState(() => (game.lastReview ? game.lastReview.round : 0));
  const reviewNew = s.lastReview && s.lastReview.round !== reviewSeen;
  const logLen = useRef(game.log.length);
  const tt = useRef(null);

  const needCurtain = !online && humans.length > 1 && act != null && !s.players[act].bot && act !== shown && !s.over;
  const viewer = online ? online.viewer : humans.length === 1 ? humans[0].id : shown;
  const me = s.players[viewer];
  const myTurn = !s.over && s.phase === 'play' && act === viewer && !s.pending.length;
  const turnKey = `${s.round}:${s.turnIdx}`;
  const landMode = landKey === turnKey;
  const setLandMode = (f) => setLandKey((k) => ((typeof f === 'function' ? f(k === turnKey) : f) ? turnKey : null));

  useEffect(() => {
    if (!online) return undefined;
    const base = document.title;
    if (myTurn) document.title = '▶ Sua vez! — MANDATO';
    return () => { document.title = base; };
  }, [online, myTurn]);
  useEffect(() => { if (online && myTurn && !muted) chime(); }, [online, myTurn, muted]);
  const toggleCenter = () => setCenterOpen((v) => { try { localStorage.setItem('mandato:center', v ? '0' : '1'); } catch { /* sem armazenamento */ } return !v; });
  const chatLen = online && online.chat ? online.chat.length : 0;
  const unread = tab === 'chat' ? 0 : Math.max(0, chatLen - seenChat);
  const pickTab = (k) => { if (k === 'chat' || tab === 'chat') setSeenChat(chatLen); setTab(k); };
  const exit = () => {
    if (online && !s.over && !window.confirm('Sair da partida? Seu lugar fica guardado: dá para voltar pela tela "Jogar online".')) return;
    onExit();
  };

  const say = useCallback((m) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 3600); }, []);
  useEffect(() => () => clearTimeout(tt.current), []);
  const switchTo = (id) => { setShown(id); setSel(null); setPlacing(null); };
  const goTab = (k) => {
    setMtab(k);
    if (k === 'market') setTab('mercado'); else if (k === 'goals') setTab('metas'); else if (k === 'log') setTab('diario');
  };

  const run = useCallback((cmd) => {
    if (online) { online.send(cmd); return true; } // online: o servidor valida e devolve o novo estado
    const r = E.apply(s, cmd);
    if (r.error) { say(r.error); return false; }
    setGame(r.state);
    return true;
  }, [s, setGame, say, online]);

  const hasSimple = me.hand.some(SIMPLE);
  const endTurn = useCallback(() => {
    if (!myTurn) return;
    const left = [];
    if (hasSimple) left.push('cartas de recurso na mão (vão para o descarte sem render nada)');
    if (!me.t.claimed && me.investRound !== s.round && s.goals.slots.some((sl) => E.goalOk(s, me, sl.id) && ((sl.gold == null && sl.silver !== me.id) || (sl.silver == null && sl.gold !== me.id)))) left.push('uma Meta que você já cumpre e não reivindicou');
    if (STANDARD.some((id) => s.market.piles[id] > 0 && (E.buyCost(s, me, id).v || 0) <= me.pool.v && (E.buyCost(s, me, id).a || 0) <= me.pool.a) && me.pool.v + me.pool.a > 0) left.push(`💰${me.pool.v}${me.pool.a ? ` e 🗳️${me.pool.a}` : ''} que ainda compram cartas (o que passar do Tesouro se perde)`);
    if (left.length && !window.confirm(`Antes de encerrar, você ainda tem:\n\n• ${left.join('\n• ')}\n\nEncerrar o turno mesmo assim?`)) return;
    setPlacing(null); setSel(null); run({ t: 'end' });
  }, [myTurn, hasSimple, run, me, s]);

  useEffect(() => {
    const prev = logLen.current;
    logLen.current = s.log.length;
    if (muted || s.log.length <= prev) return;
    const fresh = s.log.slice(prev);
    const kinds = fresh.map((l) => l.kind);
    const msgs = fresh.map((l) => l.msg || '');
    if (kinds.includes('fisc')) sfx('bell');
    else if (kinds.includes('merit')) sfx('fanfare');
    else if (kinds.includes('build')) sfx('build');
    else if (kinds.includes('buy')) sfx('coin');
    else if (msgs.some((m) => m.startsWith('🃏'))) sfx('card');
  }, [s.log, muted]);

  // Bots jogam um de cada vez, à vista de todos na mesa.
  const botWho = !s.over && act != null && s.players[act].bot ? act : null;
  const [localNote, setBotNote] = useState(null);
  const botNote = online ? online.botNote : localNote;
  const onlineErr = online && online.error ? online.error.msg : '';
  useEffect(() => {
    if (online || botWho == null) return undefined; // online: quem joga pelos bots é o servidor
    const h = setTimeout(() => {
      const r = botStep(s);
      if (r.who == null) return;
      setBotNote({ who: r.who, lines: r.lines.slice(-4).map((l) => l.msg) });
      setGame(r.state);
    }, 950);
    return () => clearTimeout(h);
  }, [s, botWho, setGame, online]);
  useEffect(() => {
    if (!botNote) return undefined;
    const h = setTimeout(() => setBotNote(null), 4200);
    return () => clearTimeout(h);
  }, [botNote]);

  // ---- seleção / construção
  const selCard = useMemo(() => {
    if (!sel) return null;
    if (sel.k === 'hand') return me.hand[sel.hi] ? { id: me.hand[sel.hi] } : null;
    if (sel.k === 'pile' || sel.k === 'reg') return { id: sel.id };
    if (sel.k === 'row') return s.market.row[sel.i] ? { id: s.market.row[sel.i] } : null;
    if (sel.k === 'wonder') return s.market.vit[sel.i] ? { id: s.market.vit[sel.i] } : null;
    if (sel.k === 'tile') { const t = s.players[sel.pid ?? viewer].tiles[sel.i]; return t && t.b ? { id: t.b.id, inst: t.b } : null; }
    return null;
  }, [sel, me, s.market, s.players, viewer]);

  const placeSpec = placing;
  const validity = useMemo(() => {
    if (!placeSpec) return null;
    return me.tiles.map((t, i) => {
      const r = E.checkBuild(s, me, { src: placeSpec.src, hi: placeSpec.hi, tile: i, v: placeSpec.v, upg: !!t.b });
      return r;
    });
  }, [placeSpec, me, s]);

  const startPlacing = (spec) => {
    const checks = me.tiles.map((t, i) => E.checkBuild(s, me, { ...spec, tile: i, upg: !!t.b }));
    if (checks.every((c) => c.err)) {
      const why = checks.map((c) => c.err).find((e) => e && !['Casa ocupada.', 'Escolha uma casa.'].includes(e)) || 'Nenhuma casa válida.';
      say(why);
      return;
    }
    setPlacing(spec);
    setMtab('city');
  };

  const onTile = (pid, i) => {
    if (pid !== viewer) { // cidade de outro jogador: só inspeciona
      setPlacing(null);
      setSel(s.players[pid].tiles[i].b ? { k: 'tile', i, pid } : null);
      return;
    }
    if (placing) {
      const r = validity[i];
      if (r.err) { say(r.err); return; }
      const t = me.tiles[i];
      const cmd = placing.src === 'wonder'
        ? { t: 'wonder', hi: placing.hi, tile: i, upg: !!t.b }
        : { t: 'build', src: placing.src, hi: placing.hi, tile: i, v: placing.v, upg: !!t.b };
      if (run(cmd)) { setPlacing(null); setSel(null); }
      return;
    }
    if (me.tiles[i].b) setSel({ k: 'tile', i, pid }); else setSel(null);
  };

  const hoverPreview = useMemo(() => {
    if (!placing || hover == null || !validity || validity[hover].err) return null;
    const r = validity[hover];
    const c0 = E.calc(s, me);
    const inst = { id: r.card.id, ...(placing.v && r.card.lot ? { v: placing.v } : {}) };
    const p2 = { ...me, tiles: me.tiles.map((t, j) => (j === hover ? { ...t, b: inst } : t)) };
    const c1 = E.calc(s, p2);
    return {
      ob: r.ob, aq: r.aq, desmate: r.desmate, upgrade: r.upgrade,
      d: { pop: c1.pop - c0.pop, poll: c1.poll - c0.poll, e: c1.sur.e - c0.sur.e, w: c1.sur.w - c0.sur.w, v: c1.inc.v - c0.inc.v, o: c1.inc.o - c0.inc.o, a: c1.inc.a - c0.inc.a },
    };
  }, [placing, hover, validity, s, me]);

  // ---- atalhos
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'Escape') { setPlacing(null); setSel(null); }
      else if ((e.key === 'e' || e.key === 'E') && myTurn) endTurn();
      else if (/^[1-9]$/.test(e.key) && me.hand[+e.key - 1]) { setSel({ k: 'hand', hi: +e.key - 1 }); setPlacing(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [myTurn, me, endTurn]);

  const playAllSimple = () => {
    if (online) { online.send({ t: 'playSimple' }); setSel(null); return; }
    let st = s;
    let n = 0;
    for (let guard = 0; guard < 12; guard++) {
      const pl = st.players[viewer];
      const hi = pl.hand.findIndex(SIMPLE);
      if (hi < 0) break;
      const r = E.apply(st, { t: 'play', hi });
      if (r.error) break;
      st = r.state;
      n++;
    }
    if (n) setGame(st); else say('Nenhuma carta simples na mão.');
    setSel(null);
  };

  const handPrimary = (hi) => {
    const id = me.hand[hi];
    const c = CARDS[id];
    if (!myTurn) return;
    if (['basic', 'standard', 'admin'].includes(c.type)) { run({ t: 'play', hi }); setSel(null); }
    else if (c.type === 'building') startPlacing({ src: 'hand', hi, v: c.lot ? lot : undefined });
  };

  // ---- inspetor
  function buyCheck(id) {
    if (!myTurn) return 'Aguarde a sua vez.';
    const c = E.buyCost(s, me, id);
    if ((c.v || 0) > me.pool.v) return `Faltam 💰 (${c.v}).`;
    if ((c.a || 0) > me.pool.a) return `Faltam 🗳️ (${c.a}).`;
    return null;
  }

  const inspector = () => {
    if (sel && sel.k === 'goal') {
      return (
        <div className="insp">
          <button type="button" className="insp-x" onClick={() => setSel(null)} aria-label="Fechar">×</button>
          <GoalDetail s={s} me={me} slot={sel.i} myTurn={myTurn} run={run} onDone={() => setSel(null)} />
        </div>
      );
    }
    if (!selCard) {
      return (
        <div className="insp empty">
          <p><b>Inspetor</b></p>
          <p>Clique numa carta da mão, do mercado ou num edifício da sua cidade para ver os detalhes e as ações.</p>
          <p className="hint">Dica: dê um clique duplo numa carta de ação para jogá-la direto.</p>
        </div>
      );
    }
    const c = CARDS[selCard.id];
    const acts = [];
    if (sel.k === 'hand') {
      if (['basic', 'standard', 'admin'].includes(c.type)) acts.push(<button key="p" type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => handPrimary(sel.hi)}>Jogar carta</button>);
      if (c.type === 'building') {
        if (c.lot) {
          acts.push(
            <div key="lot" className="lotpick" role="group" aria-label="Zona do Loteamento">
              {Object.entries(LOT_OPTS).map(([k, o]) => (
                <button key={k} type="button" className={lot === k ? 'on' : ''} onClick={() => { setLot(k); if (placing) setPlacing({ ...placing, v: k }); }} title={o.t}><Ico n={o.zone} s={16} /> {o.label}</button>
              ))}
              <p><Rich t={LOT_OPTS[lot].t} s={13} /> · Ob 🔨{LOT_OPTS[lot].obra}</p>
            </div>,
          );
        }
        acts.push(<button key="b" type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => startPlacing({ src: 'hand', hi: sel.hi, v: c.lot ? lot : undefined })}>Construir… (escolha a casa)</button>);
        acts.push(<button key="s" type="button" className="btn btn-ghost" disabled={!myTurn} onClick={() => { run({ t: 'sell', hi: sel.hi }); setSel(null); }}>Vender lote (+💰1)</button>);
      }
      if (c.type === 'decree') {
        [0, 1].forEach((slot) => acts.push(<button key={slot} type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => { run({ t: 'decree', hi: sel.hi, slot }); setSel(null); }}>Assinar no Gabinete {slot + 1}{me.cabinet[slot] ? ' (exila o atual)' : ''}</button>));
      }
      if (c.type === 'intrigue') {
        if (c.id === 'I2-03') acts.push(<p key="r" className="hint">Reação: usada automaticamente quando alguém mira você.</p>);
        else if (c.id === 'I3-02' || c.id === 'I2-04') acts.push(<button key="u" type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => { run({ t: 'intrigue', hi: sel.hi, target: null }); setSel(null); }}>Usar Intriga</button>);
        else s.players.filter((p) => p.id !== viewer).forEach((p) => acts.push(<button key={p.id} type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => { run({ t: 'intrigue', hi: sel.hi, target: p.id }); setSel(null); }} style={{ '--pc': p.color }}>Usar contra {p.name}</button>));
      }
      { // Gestão & Inteligência: trocar ou vender a carta selecionada (1× por turno cada)
        const ab = E.calc(s, me).abil, used = me.t.ab || {};
        if (myTurn && ab.has('cycle')) acts.push(<button key="cy" type="button" className="btn btn-ghost" disabled={!!used.cycle} onClick={() => { run({ t: 'ability', id: 'cycle', hi: sel.hi }); setSel(null); }}>🔁 Trocar por outra carta (Cartório){used.cycle ? ' — já usado' : ''}</button>);
        if (myTurn && ab.has('sell')) acts.push(<button key="se" type="button" className="btn btn-ghost" disabled={!!used.sell} onClick={() => { run({ t: 'ability', id: 'sell', hi: sel.hi }); setSel(null); }}>💰 Exilar e ganhar 💰3{used.sell ? ' — já usado' : ''}</button>);
      }
      if (E.calc(s, me).recycle && myTurn) acts.push(<button key="rc" type="button" className="btn btn-ghost" onClick={() => { run({ t: 'ability', id: 'recycle', hi: sel.hi }); setSel(null); }}>♻️ Exilar (Usina de Reciclagem)</button>);
    } else if (sel.k === 'pile' || sel.k === 'row' || sel.k === 'reg') {
      const why = sel.k === 'reg' && E.regionalFull(me, c.id) ? 'Você já tem todas as cópias deste projeto.' : buyCheck(c.id);
      const cost = E.buyCost(s, me, c.id);
      acts.push(<button key="buy" type="button" className="btn btn-primary" disabled={!!why} onClick={() => { run(sel.k === 'pile' ? { t: 'buy', src: 'pile', key: c.id } : sel.k === 'reg' ? { t: 'buy', src: 'regional', key: c.id } : { t: 'buy', src: 'row', key: sel.i }); setSel(null); }}>Comprar · <CostChip cost={cost} /></button>);
      if (why) acts.push(<p key="w" className="hint">{why}</p>);
      if (sel.k === 'row' && c.type === 'building' && myTurn && me.t.express) acts.push(<button key="ex" type="button" className="btn" onClick={() => startPlacing({ src: 'row', hi: sel.i, v: undefined })}>Obra Expressa: construir direto</button>);
    } else if (sel.k === 'wonder') {
      acts.push(<button key="w" type="button" className="btn btn-primary" disabled={!myTurn} onClick={() => startPlacing({ src: 'wonder', hi: sel.i })}>Construir Obra-Prima… (escolha a casa)</button>);
      acts.push(<p key="wn" className="hint">Custo total: <CostChip cost={c.cost} /> · ⭐2 (só 2 por jogador pontuam).</p>);
    } else if (sel.k === 'tile' && (sel.pid ?? viewer) !== viewer) {
      acts.push(<p key="ot" className="hint">Edifício de <b>{s.players[sel.pid].name}</b>.</p>);
    } else if (sel.k === 'tile') {
      acts.push(<button key="d" type="button" className="btn btn-ghost" disabled={!myTurn || c.id === 'PREF'} onClick={() => { run({ t: 'demolish', tile: sel.i }); setSel(null); }}>Demolir (🔨1){me.t.freeDemolish ? ' — grátis' : ''}</button>);
      if (c.id === 'PREF') acts.push(<p key="np" className="hint">A Prefeitura não pode ser demolida.</p>);
    }
    return (
      <div className="insp">
        <button type="button" className="insp-x" onClick={() => { setSel(null); setPlacing(null); }} aria-label="Fechar">×</button>
        <Card id={c.id} instance={selCard.inst} />
        <div className="insp-acts">{acts}</div>
      </div>
    );
  };

  // ---- sub-blocos
  const stdCards = STANDARD.map((id) => {
    const cost = E.buyCost(s, me, id);
    const left = s.market.piles[id];
    return (
      <div key={id} className="stack">
        <button type="button" className="eye" onClick={() => setZoom(id)} title="Ver a carta" aria-label="Ver a carta">👁</button>
        <Card id={id} size="sm" costOverride={cost} selected={sel && sel.k === 'pile' && sel.id === id} disabled={!myTurn || buyCheck(id) !== null || left <= 0} onClick={() => { setSel({ k: 'pile', id }); setPlacing(null); }} />
        <span className="stack-n">{left} na pilha</span>
      </div>
    );
  });

  const market = (
    <div className="market">
      <h3 className="h">Mercado Padrão <small>sempre disponível · não dispara Fiscalização</small></h3>
      <div className="row">{stdCards}</div>
      <h3 className="h">Seus Projetos Regionais <small>só do seu terreno · 1 de cada (Balsa: 2) · 💰3 + 🗳️1</small></h3>
      <div className="row">
        {E.regionalOf(me).map((id) => {
          const owned = E.regionalFull(me, id);
          const lim = E.regionalLimit(id);
          const have = E.copiesOf(me, id);
          return (
            <div key={id} className="stack">
              <button type="button" className="eye" onClick={() => setZoom(id)} title="Ver a carta" aria-label="Ver a carta">👁</button>
              <Card id={id} size="sm" costOverride={E.buyCost(s, me, id)} selected={sel && sel.k === 'reg' && sel.id === id} disabled={owned || !myTurn || buyCheck(id) !== null} onClick={() => { setSel({ k: 'reg', id }); setPlacing(null); }} />
              <span className="stack-n">{owned ? 'já é seu' : lim > 1 ? `${have}/${lim} compradas` : 'disponível'}</span>
            </div>
          );
        })}
        {!E.regionalOf(me).length && <p className="empty">Escolha um terreno para liberar seus projetos.</p>}
      </div>
      <h3 className="h">Fila Especial <small>{s.market.deck.length} no baralho · 🔔 dispara Fiscalização ao entrar</small></h3>
      <div className="row">
        {s.market.row.map((id, i) => (
          <div key={id + i} className="stack">
            <button type="button" className="eye" onClick={() => setZoom(id)} title="Ver a carta" aria-label="Ver a carta">👁</button>
            <Card id={id} size="sm" costOverride={E.buyCost(s, me, id)} selected={sel && sel.k === 'row' && sel.i === i} disabled={!myTurn || buyCheck(id) !== null} onClick={() => { setSel({ k: 'row', i }); setPlacing(null); }} />
          </div>
        ))}
        {!s.market.row.length && <p className="empty">Fila esgotada.</p>}
      </div>
      <h3 className="h">Obras-Prima <small>⭐2 · máx. 2 pontuam por jogador</small></h3>
      <div className="row">
        {s.market.vit.map((id, i) => <div key={id} className="stack"><button type="button" className="eye" onClick={() => setZoom(id)} title="Ver a carta" aria-label="Ver a carta">👁</button><Card id={id} size="sm" selected={sel && sel.k === 'wonder' && sel.i === i} onClick={() => { setSel({ k: 'wonder', i }); setPlacing(null); }} /></div>)}
      </div>
    </div>
  );

  const cabinetOf = (p) => (
    <div className={`cabinet${p.id === viewer ? '' : ' cab-mini'}`}>
      <span className="cab-l">Gabinete</span>
      {p.cabinet.map((id, i) => (
        <div key={i} className={`cab-slot${id ? ' on' : ''}`} title={id ? `${CARDS[id].name}: ${CARDS[id].t} ${CARDS[id].penalty || ''}` : 'Espaço vazio'}>
          {id ? (<><b>{CARDS[id].name}</b>{p.id === viewer && <small><Rich t={CARDS[id].t} s={12} /></small>}</>) : <small>vazio</small>}
        </div>
      ))}
      {p.id === viewer && p.terrain === 'ilha' && myTurn && (
        <div className="rota" title="Rota Marítima (1×/turno)">
          <button type="button" className="btn sm" onClick={() => run({ t: 'ability', id: 'rota', dir: 'v2a' })}>💰2 → 🗳️1</button>
          <button type="button" className="btn sm" onClick={() => run({ t: 'ability', id: 'rota', dir: 'a2v' })}>🗳️1 → 💰2</button>
        </div>
      )}
    </div>
  );

  const landProp = landMode && myTurn && !placing
    ? { slots: E.landSlots(me), cost: E.landCost(me).v, onPick: (o) => { run({ t: 'land', x: o.x, y: o.y, isl: o.isl }); setLandMode(false); } }
    : null;

  const placingBar = placing && (
    <div className="placing" role="status">
      <div>
        Escolha uma casa para <b>{placing.src === 'wonder' ? CARDS[s.market.vit[placing.hi]]?.name : placing.src === 'row' ? CARDS[s.market.row[placing.hi]]?.name : (CARDS[me.hand[placing.hi]]?.lot ? `Loteamento (${LOT_OPTS[placing.v].label})` : CARDS[me.hand[placing.hi]]?.name)}</b>
        {hoverPreview ? (
          <span className="prev">
            Custo <Rich t={`🔨${hoverPreview.ob}`} s={14} />{hoverPreview.aq && (hoverPreview.aq.v || hoverPreview.aq.a) ? <> + <Rich t={`${hoverPreview.aq.v ? `💰${hoverPreview.aq.v}` : ''} ${hoverPreview.aq.a ? `🗳️${hoverPreview.aq.a}` : ''}`} s={14} /></> : null}
            {hoverPreview.desmate ? ' · desmata a Floresta (+🔨1)' : ''}{hoverPreview.upgrade ? ' · melhoria' : ''}
            {' — '}
            {[['pop', '👥'], ['poll', '☁️'], ['e', '⚡'], ['w', '💧'], ['v', '💰'], ['o', '🔨'], ['a', '🗳️']].filter(([k]) => hoverPreview.d[k]).map(([k, ic]) => <span key={k} className={`dl ${(k === 'poll' ? hoverPreview.d[k] > 0 : hoverPreview.d[k] < 0) ? 'neg' : 'pos'}`}><Rich t={ic} s={13} />{hoverPreview.d[k] > 0 ? '+' : ''}{hoverPreview.d[k]}</span>)}
          </span>
        ) : <span className="prev">passe o mouse numa casa para ver o efeito.</span>}
      </div>
      <button type="button" className="m-link" onClick={() => setPlacing(null)}>cancelar (Esc)</button>
    </div>
  );

  // Um lugar à mesa: a cidade de cada jogador, sempre à vista de todos.
  const lastOf = (p) => { for (let i = s.log.length - 1; i >= 0; i--) { const l = s.log[i]; if (l.pid === p.id && l.kind !== 'turn' && l.kind !== 'round') return l.msg; } return null; };
  const seat = (p) => {
    const mine = p.id === viewer;
    const turn = !s.over && act === p.id;
    const T = TERRAINS[p.terrain];
    const last = lastOf(p);
    return (
      <article key={p.id} className={`seat${mine ? ' mine' : ' compact'}${turn ? ' turn' : ''}`} style={{ '--pc': p.color }} aria-label={`Cidade de ${p.name}`}>
        <header className="seat-h">
          <i className="disc" style={{ background: p.color }} />
          <b>{p.name}{mine ? ' (você)' : ''}</b>
          {p.bot && <small className="botk">bot</small>}
          {online && online.presence && online.presence[p.id] === false && (
            <>
              <small className="botk offl">offline</small>
              {online.host === online.viewer && <button type="button" className="m-link" onClick={() => online.botify(p.id)} title="Um bot assume este lugar para a mesa não travar">trocar por bot</button>}
            </>
          )}
          <span className="seat-sub"><TerrainGlyph id={p.terrain} s={16} /> {T.name} · {CARGO(p.merit)}</span>
          {turn && <span className="seat-turn">{botWho === p.id ? 'jogando…' : 'na vez'}</span>}
          <span className="pl-merit" title="Mérito"><Ico n="star" s={18} />{p.merit}</span>
        </header>
        {last && <p className="seat-last" key={last} title="Última jogada"><Rich t={last} s={12} /></p>}
        <div className="seat-body">
          <div className="seat-city">
            <City s={s} p={p} placing={mine && !!placing} validity={mine ? validity : null} onTile={(i) => onTile(p.id, i)} selected={sel && sel.k === 'tile' && (sel.pid ?? viewer) === p.id ? sel.i : null} onHover={mine ? setHover : undefined} land={mine ? landProp : null} />
            {mine && placingBar}
          </div>
          {seatInfo(p, mine, turn, T)}
        </div>
      </article>
    );
  };
  const seatInfo = (p, mine, turn, T) => (
          <div className="seat-info">
            <MetersMini s={s} p={p} />
            <CityMarks s={s} p={p} />
            {mine && turn && myTurn && (() => { // habilidades dos prédios de Gestão & Inteligência
              const c = E.calc(s, p), used = p.t.ab || {};
              const rivals = s.players.filter((q) => q.id !== p.id);
              if (!c.abil.has('study') && !c.abil.has('spy') && !c.abil.has('cycle') && !c.abil.has('sell')) return null;
              return (
                <div className="abilities">
                  {c.abil.has('study') && <button type="button" className="btn sm" disabled={!!used.study || p.pool.a < 1} onClick={() => run({ t: 'ability', id: 'study' })}>📚 Comprar 1 carta · 🗳️1</button>}
                  {c.abil.has('spy') && rivals.map((q) => {
                    const left = (c.spyUses || 1) - (used.spy || 0);
                    const proof = E.calc(s, q).spyProof;
                    return <button key={q.id} type="button" className="btn sm" disabled={left <= 0 || proof} title={proof ? 'Tem Corregedoria: a Inteligência não alcança' : 'Esse rival adiciona 1 🕵️ ao Saco'} onClick={() => run({ t: 'ability', id: 'spy', target: q.id })}><i className="disc sm" style={{ background: q.color }} /> 🕶️ Espionar {q.name}</button>;
                  })}
                  {(c.abil.has('cycle') || c.abil.has('sell')) && <small className="hint">Trocar / vender carta: selecione a carta na mão.</small>}
                </div>
              );
            })()}
            {mine && turn && myTurn && (() => {
              const cost = E.landCost(p).v, slots = E.landSlots(p);
              const why = p.t.landed ? 'já comprou neste turno' : !slots.length ? 'grade no limite (5×5)' : p.pool.v < cost ? `faltam 💰 (custa ${cost})` : '';
              return (
                <button type="button" className={`btn sm land-btn${landMode ? ' on' : ''}`} disabled={!!why && !landMode} title={why || 'Escolha uma casa vizinha da cidade'}
                  onClick={() => { setPlacing(null); setLandMode((v) => !v); }}>
                  {landMode ? 'Cancelar compra de terreno' : <>🗺️ Comprar terreno · 💰{cost}{why ? <small> ({why})</small> : null}</>}
                </button>
              );
            })()}
            {turn && s.phase === 'play' && (
              <div className="seat-pool"><span>Em jogo agora</span><ResPool pool={p.pool} size={18} /></div>
            )}
            {cabinetOf(p)}
            {mine && (
              <details className="tnote-d">
                <summary>Terreno: ▲ {T.trait} · ▼ {T.weak}</summary>
                <p className="tnote"><b>▲ {T.trait}:</b> <Rich t={T.traitT} s={13} /> <b>▼ {T.weak}:</b> <Rich t={T.weakT} s={13} /></p>
              </details>
            )}
            <p className="seat-cards">mão {p.hand.length} · deck {p.deck.length} · descarte {p.discard.length}</p>
          </div>
  );

  const handOpen = myTurn || peek || !!placing || s.over;
  const hand = (
    <div className={`handwrap${myTurn ? '' : ' waiting'}${handOpen ? '' : ' closed'}`}>
      <div className="hand-head">
        <h3 className="h">{myTurn ? 'Sua mão' : 'Sua próxima mão'} <small>{me.hand.length} cartas · deck {me.deck.length} · descarte {me.discard.length}</small> <button type="button" className="m-link" onClick={() => setDeckOpen(true)}>ver deck e descarte</button></h3>
        {myTurn && <button type="button" className="btn sm" onClick={playAllSimple} disabled={!hasSimple}>Jogar recursos simples</button>}
        {!myTurn && <button type="button" className="m-link" onClick={() => setPeek((v) => !v)}>{handOpen ? 'recolher a mão' : 'ver a mão'}</button>}
      </div>
      <div className="hand">
        {me.hand.map((id, hi) => (
          <div key={`${id}-${hi}`} className="hcell" style={{ '--i': hi - (me.hand.length - 1) / 2, '--n': me.hand.length }} onDoubleClick={() => handPrimary(hi)}>
            <Card id={id} size="sm" selected={sel && sel.k === 'hand' && sel.hi === hi} dim={!myTurn} onClick={() => { setSel({ k: 'hand', hi }); setPlacing(null); }} tag={<kbd className="hk">{hi + 1}</kbd>} />
          </div>
        ))}
        {!me.hand.length && <p className="empty">Mão vazia.</p>}
      </div>
    </div>
  );

  const pe = s.pending[0];
  const mtabs = [['city', 'Cidade'], ['market', 'Mercado'], ['goals', 'Metas'], ['log', 'Diário']];
  const PEND = { faction: 'avançar numa Facção', option: 'escolher um efeito', explore: 'explorar', hand: 'escolher uma carta da mão', pick: 'escolher o Pacote de Posição', reaction: 'reagir a uma Intriga', tile: 'escolher uma casa' };
  const waitbar = pe && pe.pid !== viewer && !needCurtain && (
    <div className="waitbar" role="status"><i className="disc" style={{ background: s.players[pe.pid].color }} /> {s.players[pe.pid].name} está decidindo: {PEND[pe.kind] || 'uma escolha'}…</div>
  );

  if (s.phase === 'draft') {
    return (
      <>
        <div className="topbar"><Brand />{online && <span className="roomchip" title="Código da sala">Sala <b>{online.code}</b></span>}<div className="tb-r"><button type="button" className="btn btn-ghost sm" onClick={() => setShowRules(true)}>Regras</button><button type="button" className="btn btn-ghost sm" onClick={exit}>Sair</button></div></div>
        <Draft s={s} viewer={viewer} onPick={(terrain) => run({ t: 'pick', terrain })} />
        {pe && pe.pid === viewer && <PendingModal s={s} pe={pe} viewer={viewer} run={run} />}
        {waitbar}
        {(toast || onlineErr) && <div className="toast" role="status">{toast || onlineErr}</div>}
        {showRules && <Rules onClose={() => setShowRules(false)} />}
        {needCurtain && <Curtain name={s.players[act].name} color={s.players[act].color} why="É a vez de escolher o terreno." onOk={() => switchTo(act)} />}
      </>
    );
  }

  return (
    <div className={`table mt-${mtab}${view === 'mesa' ? ' tt' : ''}`}>
      <div className="topbar">
        <Brand />{online && <span className="roomchip" title="Código da sala">Sala <b>{online.code}</b></span>}
        <MeritTrack s={s} />
        <div className="tb-r">
          <button type="button" className="btn btn-ghost sm" onClick={() => setMuted((m) => { saveMuted(!m); return !m; })} title={muted ? 'Ligar os sons' : 'Silenciar os sons'} aria-pressed={!muted}>{muted ? '🔕' : '🔔'}</button>
          <label className="viewsel" title="Como ver a mesa">
            <span className="sr-only">Visualização</span>
            <select value={view} onChange={(e) => setView(e.target.value)}>{VIEWS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
          <button type="button" className="btn btn-ghost sm" onClick={() => setCoach(true)} title="Tour guiado pela mesa">Tutorial</button>
          <button type="button" className="btn btn-ghost sm" onClick={() => setShowRules(true)}>Regras</button>
          <button type="button" className="btn btn-ghost sm" onClick={exit}>Sair</button>
        </div>
      </div>
      <RoundBanner s={s} onBag={() => setBagOpen(true)} />

      <div className="grid">
        <section className="pane pane-board" data-pane="city" aria-label="Mesa principal">
          <div className="board-top">
            <button type="button" className="center-toggle" onClick={toggleCenter} aria-expanded={centerOpen}>
              <span>{centerOpen ? '▾' : '▸'}</span> Centro da mesa <small>Metas e Facções{centerOpen ? '' : ' — abrir'}</small>
            </button>
            <TurnStrip s={s} act={act} />
          </div>
          {view === 'mesa' ? (
            <div className="tt-stage">
              <Suspense fallback={<div className="tt-wrap tt-loading">carregando a mesa 3D…</div>}>
                <Table3D s={s} viewer={viewer} act={act} placing={placing} validity={validity} sel={sel} onTile={onTile} onHover={setHover} land={landProp}
                  onPick={(v) => { setSel(v); setPlacing(null); }} onZoom={setZoom} />
              </Suspense>
              <details className="tt-hud" style={{ '--pc': me.color }} open>
                <summary>Sua cidade</summary>
                {seatInfo(me, true, !s.over && act === me.id, TERRAINS[me.terrain])}
              </details>
              {placingBar}
            </div>
          ) : (
          <div className={`cities c${s.players.length}`}>
            <div className="seat-main">{seat(me)}</div>
            <div className="board-rest">
              {centerOpen && <CenterBoard s={s} onGoals={(i) => { setSel({ k: 'goal', i }); setPlacing(null); }} />}
              {s.players.length > 1 && <div className="others">{[...s.players.slice(viewer + 1), ...s.players.slice(0, viewer)].map(seat)}</div>}
            </div>
          </div>
          )}
        </section>

        <aside className="pane pane-side">
          <div className="pane pane-insp" data-pane="city">{inspector()}</div>
          <div className="tabs" role="tablist">
            {[['mercado', 'Mercado'], ['metas', 'Metas'], ['diario', 'Diário'], ...(online ? [['chat', 'Conversa']] : [])].map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => pickTab(k)}>{l}{k === 'chat' && unread > 0 && <i className="badge">{unread}</i>}</button>
            ))}
          </div>
          <div className="tabbody">
            <div className="pane" data-pane="market" hidden={tab !== 'mercado'}>{market}</div>
            <div className="pane" data-pane="goals" hidden={tab !== 'metas'}><Goals s={s} me={me} myTurn={myTurn} run={run} /></div>
            <div className="pane" data-pane="log" hidden={tab !== 'diario'}><Log s={s} viewer={viewer} /></div>
            {online && <div className="pane" data-pane="chat" hidden={tab !== 'chat'}><Chat list={online.chat || []} you={viewer} colors={s.players.map((p) => p.color)} onSend={online.sendChat} /></div>}
          </div>
        </aside>
      </div>

      <footer className="dock">
        <div className="dock-main">
          <div className="dock-res">
            <ResPool pool={me.pool} />
            <div className="dock-meta">
              <span>Renda/turno: <Rich t={(() => { const c = E.calc(s, me); return `💰${c.inc.v} 🔨${c.inc.o} 🗳️${c.inc.a}`; })()} s={14} /></span>
              <span className="who">{myTurn ? 'É a sua vez' : s.over ? 'Fim de jogo' : `Vez de ${s.players[act]?.name || '…'}`}</span>
            </div>
            <button type="button" className="btn btn-primary end" disabled={!myTurn} onClick={endTurn}>Encerrar turno <kbd>E</kbd></button>
          </div>
          {hand}
        </div>
      </footer>

      <nav className="mnav" aria-label="Seções">
        {mtabs.map(([k, l]) => <button key={k} type="button" className={mtab === k ? 'on' : ''} onClick={() => goTab(k)}>{l}</button>)}
      </nav>

      {botNote && !s.over && (
        <div className="botnote" role="status" style={{ '--pc': s.players[botNote.who].color }}>
          <b><i className="disc" style={{ background: s.players[botNote.who].color }} /> {s.players[botNote.who].name} jogou</b>
          {botNote.lines.map((m, i) => <span key={i}><Rich t={m} s={13} /></span>)}
        </div>
      )}
      {(toast || onlineErr) && <div className="toast" role="status">{toast || onlineErr}</div>}
      {pe && pe.pid === viewer && <PendingModal s={s} pe={pe} viewer={viewer} run={run} />}
      {waitbar}
      {online && !online.connected && <div className="reconn" role="alert">Conexão perdida — reconectando…</div>}
      {showRules && <Rules onClose={() => setShowRules(false)} />}
      {bagOpen && <BagInfo s={s} onClose={() => setBagOpen(false)} />}
      {deckOpen && <DeckView p={me} onClose={() => setDeckOpen(false)} />}
      {zoom && <CardZoom id={zoom} onClose={() => setZoom(null)} />}
      {reviewNew && !needCurtain && <PartyReveal s={s} onClose={() => setReviewSeen(s.lastReview.round)} />}
      {s.lastFisc && s.lastFisc.id !== fiscSeen && !reviewNew && !needCurtain && !s.over && <FiscReveal s={s} onClose={() => setFiscSeen(s.lastFisc.id)} />}
      {coach && !needCurtain && <Coach onClose={() => setCoach(false)} />}
      {s.over && !hideOver && (
        <GameOver
          s={s}
          onAgain={onExit}
          againLabel={online ? 'Sair da sala' : 'Jogar de novo'}
          onView={() => setHideOver(true)}
          extra={online && (online.host === online.viewer
            ? <button type="button" className="btn btn-primary" onClick={online.rematch}>Revanche na mesma sala</button>
            : <p className="hint">O anfitrião pode abrir uma revanche com a mesma turma.</p>)}
        />
      )}
      {s.over && hideOver && <button type="button" className="btn btn-primary over-back" onClick={() => setHideOver(false)}>Ver o resultado</button>}
      {needCurtain && <Curtain name={s.players[act].name} color={s.players[act].color} why={pe ? 'Há uma decisão para você.' : 'É a sua vez de jogar. Ninguém mais deve ver a tela.'} onOk={() => switchTo(act)} />}
    </div>
  );
}

export function Brand() {
  return (
    <div className="brand"><span className="brand-star"><Ico n="star" s={22} /></span><b>MANDATO</b><small>A Ascensão do Prefeito</small></div>
  );
}

export { ZONES };
