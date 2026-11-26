// Tela da partida do GARIMPO. Serve para o jogo local (contra bots) e para o online:
// recebe o estado (ou a visão do servidor), quem sou eu, de quem é a vez e uma função send(cmd).
import { lazy, Suspense, useMemo, useState } from 'react';
import * as E from '../engine.js';
import { CARDS, MASCATE, DLCS, FURY_DRAWS, MAX_FOLEGO, OUT_DRAWS } from '../data.js';
import Mine from './Mine.jsx';
import { art, hasArt, cardLines, cardType, relicName, PLAYER_HEX, roomLabel, asset, ROOM_COLOR, ROOM_GLYPH } from './text.js';

const Table3D = lazy(() => import('./Table3D.jsx'));

export function Card({ id, onClick, disabled, footer, small, hidden }) {
  if (hidden || !id) return <div className={`gm-card back${small ? ' small' : ''}`} style={{ backgroundImage: `url(${asset('verso.webp')})` }} />;
  const c = CARDS[id];
  return (
    <button type="button" className={`gm-card t-${c.type}${small ? ' small' : ''}${onClick && !disabled ? ' can' : ''}`} onClick={disabled ? undefined : onClick} disabled={!onClick || disabled}>
      <div className="gm-card-art" style={hasArt(id) ? { backgroundImage: `url(${art(id)})` } : undefined}>{!hasArt(id) && <span className="gm-card-ph">{c.luz ? '🔦' : c.prosa ? '🤝' : c.pic ? '⛏' : c.type === 'beast' ? '🐾' : '✦'}</span>}{c.quake && <span className="gm-quake" title="Rachadura: dispara a Fúria ao entrar na Fila">🌋</span>}</div>
      <div className="gm-card-head">
        <span className="gm-card-name">{c.name}</span>
        {c.cost !== undefined && <span className="gm-card-cost">🤝{c.cost}</span>}
        {c.fight !== undefined && <span className="gm-card-cost fight">⛏{c.fight}</span>}
      </div>
      <div className="gm-card-type">{cardType(id)}{c.pts ? ` · ✦${c.pts}` : ''}</div>
      <ul className="gm-card-text">{cardLines(id).map((l) => <li key={l}>{l}</li>)}</ul>
      {footer && <div className="gm-card-foot">{footer}</div>}
    </button>
  );
}

function Track({ s }) {
  return (
    <div className="gm-track">
      <div className="gm-fury" title="Trilha da Fúria: quantos cubos saem da Bateia a cada Fúria. Sobe a cada Relíquia (Ninho: +2)">
        <span className="lbl">Fúria</span>
        {FURY_DRAWS.map((d, i) => <span key={i} className={`step${s.fury === i + 1 ? ' on' : ''}${s.fury > i + 1 ? ' past' : ''}`}>{d}</span>)}
        {s.furyExtra ? <span className="extra">+{s.furyExtra}</span> : null}
      </div>
      <div className="gm-end" title="Quando o primeiro sai ou fica soterrado, a mina começa a ruir: no turno de quem já saiu, saem cubos da Bateia">
        {s.ending ? <span className="ruindo">⚠ A mina está ruindo: {OUT_DRAWS(s.players.length)} cubos por turno de quem saiu</span> : <span>Rodada {s.turnNo} · peças no monte: {s.map.stack?.length ?? '—'}</span>}
      </div>
    </div>
  );
}

// Bateia: pedras pretas e os cubos de barulho de cada um
function Bateia({ s }) {
  const total = s.bag.stone + s.bag.p.reduce((a, b) => a + b, 0);
  return (
    <div className="gm-bateia" title="Bateia: a cada Fúria saem cubos daqui. Pedra preta não faz nada; cubo de jogador vira dano">
      <div className="gm-bateia-title">Bateia <small>({total} cubos)</small></div>
      <div className="gm-bateia-bowl">
        {Array.from({ length: Math.min(s.bag.stone, 30) }).map((_, i) => <i key={`s${i}`} className="cube stone" />)}
        {s.players.flatMap((p) => Array.from({ length: Math.min(s.bag.p[p.id], 20) }).map((_, i) => <i key={`${p.id}-${i}`} className="cube" style={{ background: PLAYER_HEX[p.color] }} />))}
      </div>
    </div>
  );
}

// Tabuleiro do jogador: medidor de Fôlego (cubos de dano), reserva de cubos e barulho do turno
function PlayerBoard({ s, p, you, actor }) {
  const sc = E.scoreOf(s, p);
  const dmg = p.dmg ?? (MAX_FOLEGO - p.folego);
  return (
    <div className={`gm-player${actor === p.id ? ' turn' : ''}${p.id === you ? ' me' : ''}`} style={{ borderColor: PLAYER_HEX[p.color] }}>
      <div className="nm"><span className="dot" style={{ background: PLAYER_HEX[p.color] }} />{p.name}{p.bot ? ' 🤖' : ''}<span className="pts">✦{sc.total}</span></div>
      <div className="gm-health" title={`Fôlego: ${p.folego}/${MAX_FOLEGO}. Cada cubo no medidor é um dano; medidor cheio = soterrado`}>
        {Array.from({ length: MAX_FOLEGO }).map((_, i) => <span key={i} className={`slot${i < dmg ? ' hit' : ''}${i === MAX_FOLEGO - 1 ? ' last' : ''}`} style={i < dmg ? { background: PLAYER_HEX[p.color] } : undefined} />)}
      </div>
      <div className="st">
        {p.status === 'out' ? '🏁 saiu da mina' : p.status === 'dead' ? `🪦 soterrado ${p.deadZone === 'segura' ? '(perto da Boca)' : '(no fundo)'}` : `📍 ${roomLabel(s.map.nodes[p.node]?.kind)}`}
      </div>
      <div className="st">🧊 reserva {p.cubes} · 💥 turno {Math.max(0, p.area || 0)} · na Bateia {s.bag.p[p.id]}</div>
      <div className="st">🟡{p.gold} 💠{p.crystals} · 🃏{E.allCards(p).length}</div>
      {p.relics.length > 0 && <div className="st relic">🏺 {p.relics.map((r) => relicName(r)).join(', ')}</div>}
      {p.items.length > 0 && <div className="st">🎒 {p.items.map((k) => MASCATE[k].name).join(', ')}</div>}
    </div>
  );
}

function Players({ s, you, actor }) {
  return (
    <div className="gm-players">
      {s.players.map((p) => <PlayerBoard key={p.id} s={s} p={p} you={you} actor={actor} />)}
      <Bateia s={s} />
    </div>
  );
}

// Prévia de uma peça numa rotação: salas, túneis e saídas
function TilePreview({ tile, rot, enterSide }) {
  const b = E.buildTile(tile, rot);
  const u = 30; const S = u * 3;
  const pt = (r) => ({ x: r.cx * u + u / 2, y: r.cy * u + u / 2 });
  const MID = { N: [S / 2, 0], S: [S / 2, S], E: [S, S / 2], W: [0, S / 2] };
  const col = (c) => ({ dark: '#120f0c', rail: '#9a9a9a', rub: '#5a5550' }[c] || '#8a5a32');
  return (
    <svg viewBox={`-6 -6 ${S + 12} ${S + 12}`} className="gm-tileprev">
      <rect x="0" y="0" width={S} height={S} rx="10" className={`gm-tile ${tile.zone}`} />
      {b.tun.map(([i, j, c], k) => { const a = pt(b.rooms[i]); const c2 = pt(b.rooms[j]); return <line key={k} x1={a.x} y1={a.y} x2={c2.x} y2={c2.y} stroke={col(c)} strokeWidth="5" strokeLinecap="round" />; })}
      {Object.entries(b.edge).map(([side, e]) => { const a = pt(b.rooms[e.room]); const [x, y] = MID[side]; return <line key={side} x1={a.x} y1={a.y} x2={x} y2={y} stroke={side === enterSide ? '#e8b53a' : col(e.type)} strokeWidth={side === enterSide ? 6 : 5} strokeLinecap="round" />; })}
      {b.rooms.map((r, i) => { const a = pt(r); return <g key={i}><circle cx={a.x} cy={a.y} r="10" fill={ROOM_COLOR[r.kind] || '#5b4a3a'} /><text x={a.x} y={a.y + 4} textAnchor="middle" fontSize="10">{ROOM_GLYPH[r.kind] || ''}</text></g>; })}
    </svg>
  );
}

function Pending({ s, you, send }) {
  const pd = s.pending[0];
  if (!pd || pd.pid !== you) return null;
  const p = s.players[you];
  if (pd.k === 'place') {
    const kinds = [...new Set(pd.tile.k)].map((k) => roomLabel(k)).join(', ');
    return (
      <div className="gm-modal">
        <h3>Você descobriu uma peça {pd.tile.zone === 'segura' ? 'segura' : 'do fundo'}</h3>
        <p>Salas: {kinds}. Escolha a rotação. A borda dourada é por onde você entra, e só valem as rotações em que a peça encaixa nela.</p>
        <div className="gm-choices">
          {pd.rots.map((rot) => (
            <button key={rot} type="button" className="gm-rot" onClick={() => send({ t: 'choose', rot })}>
              <TilePreview tile={pd.tile} rot={rot} enterSide={pd.enterSide} />
              <small>{['0°', '90°', '180°', '270°'][rot]}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (pd.k === 'trash') {
    const list = [...p.hand.map((id, i) => ({ id, i, from: 'hand' })), ...p.play.map((id, i) => ({ id, i, from: 'play' })), ...p.discard.map((id, i) => ({ id, i, from: 'discard' }))];
    return (
      <div className="gm-modal">
        <h3>{pd.why || 'Benzedeira'}: destruir uma carta?</h3>
        <p>A carta sai do jogo de vez. Deixar o baralho enxuto faz as boas aparecerem mais.</p>
        <div className="gm-cardrow">{list.map((x) => <Card key={`${x.from}${x.i}`} id={x.id} small onClick={() => send({ t: 'choose', from: x.from, i: x.i })} footer={({ hand: 'mão', play: 'jogada', discard: 'descarte' })[x.from]} />)}</div>
        <button type="button" className="gm-skip" onClick={() => send({ t: 'choose', skip: true })}>Não destruir</button>
      </div>
    );
  }
  if (pd.k === 'discard1') {
    return (
      <div className="gm-modal">
        <h3>Diário do Engenheiro: descarte 1 carta da mão</h3>
        <div className="gm-cardrow">{p.hand.map((id, i) => <Card key={i} id={id} small onClick={() => send({ t: 'choose', i })} />)}</div>
      </div>
    );
  }
  if (pd.k === 'gainCheap') {
    const max = pd.max || 3;
    return (
      <div className="gm-modal">
        <h3>{pd.why || 'Capataz'}: ganhe uma carta da Fila de custo até 🤝{max}</h3>
        <div className="gm-cardrow">{s.row.map((id, i) => <Card key={i} id={id} small disabled={!(CARDS[id].cost <= max && !['beast', 'hazard'].includes(CARDS[id].type))} onClick={() => send({ t: 'choose', i })} />)}</div>
        <button type="button" className="gm-skip" onClick={() => send({ t: 'choose', skip: true })}>Não pegar</button>
      </div>
    );
  }
  if (pd.k === 'grisu') {
    return (
      <div className="gm-modal side">
        <h3>Grisu! Clique na sala onde o gás vai ficar</h3>
        <p>Entrar nela vai custar 🫧1 a quem passar. Pode ser numa sala funda, longe de você.</p>
        <button type="button" className="gm-skip" onClick={() => send(E.defaultChoice(s, pd))}>Escolher por mim</button>
      </div>
    );
  }
  return null;
}

function Actions({ s, me, send }) {
  const t = me.t || {};
  const btn = [];
  const relic = s.relics[me.node];
  const kind = s.map.nodes[me.node]?.kind;
  if (relic) btn.push(<button key="take" type="button" className="hot" disabled={me.relics.length >= E.relicCap(me)} onClick={() => send({ t: 'take' })}>Pegar {relicName(relic)}</button>);
  if (kind === 'mascate') {
    for (const [k, m] of Object.entries(MASCATE)) btn.push(<button key={k} type="button" disabled={t.mascate || me.gold < m.gold || s.mascate[k] <= 0 || (k !== 'cantil' && E.hasItem(me, k))} onClick={() => send({ t: 'mascate', item: k })}>{m.name} 🟡{m.gold}</button>);
  }
  if (kind === 'barracao') btn.push(<button key="rest" type="button" disabled={t.rest || t.prosa < 2} onClick={() => send({ t: 'rest' })}>Descansar (🤝2 → 🫧+1)</button>);
  for (const k of s.rubble) {
    const e = s.map.edges.find((x) => x.key === k);
    if (e && (e.a === me.node || e.b === me.node)) btn.push(<button key={k} type="button" disabled={!(t.dyn > 0 || t.pic >= 3)} onClick={() => send({ t: 'clear', edge: k })}>Limpar desabamento (⛏3)</button>);
  }
  if (s.map.mode === 'explorar') {
    for (const st of E.stubs(s, me.node)) if (st.pass.type === 'rubble') btn.push(<button key={`r${st.dir}`} type="button" disabled={!(t.dyn > 0 || t.pic >= 3)} onClick={() => send({ t: 'clear', dir: st.dir })}>Limpar desabamento {({ L: '←', R: '→', U: '↑', D: '↓' })[st.dir]} (⛏3)</button>);
  }
  for (const n of s.grisu) {
    if (n === me.node || E.neighbors(s, me.node).some((x) => x.to === n)) btn.push(<button key={`g${n}`} type="button" disabled={t.pic < 2} onClick={() => send({ t: 'clear', node: n })}>Ventilar Grisu (⛏2)</button>);
  }
  if (s.cerb) {
    btn.push(<button key="calm" type="button" disabled={s.cerb.awake <= 0 || !(t.calm > 0 || t.prosa >= DLCS.cerbero.calmCost)} onClick={() => send({ t: 'calm' })}>Acalmar Cérbero ({t.calm > 0 ? 'carta' : `🤝${DLCS.cerbero.calmCost}`})</button>);
    if (t.lure > 0) btn.push(<button key="lure" type="button" onClick={() => send({ t: 'lure' })}>Jogar o osso</button>);
    btn.push(<button key="fc" type="button" disabled={t.pic < DLCS.cerbero.fightCost} onClick={() => send({ t: 'fightCerb' })}>Enfrentar Cérbero (⛏{DLCS.cerbero.fightCost})</button>);
  }
  if (s.medusa) btn.push(<button key="fm" type="button" disabled={t.pic < DLCS.medusa.fightCost} onClick={() => send({ t: 'fightMedusa' })}>Afastar Medusa (⛏{DLCS.medusa.fightCost})</button>);
  return <div className="gm-actions">{btn}</div>;
}

// Pilha de cartas (baralho, jogadas, descarte): mostra a de cima e a quantidade; clique abre a lista
function Pile({ label, ids, hidden, onOpen }) {
  const top = ids[ids.length - 1];
  return (
    <button type="button" className={`gm-pile${ids.length ? '' : ' empty'}`} onClick={onOpen} title={`${label}: ${ids.length} carta(s). Clique para ver`}>
      <div className="gm-pile-stack">
        {ids.length > 2 && <span className="layer l2" />}
        {ids.length > 1 && <span className="layer l1" />}
        {ids.length ? (hidden ? <span className="face back" style={{ backgroundImage: `url(${asset('verso.webp')})` }} /> : <span className="face" style={hasArt(top) ? { backgroundImage: `url(${art(top)})` } : undefined}><b>{CARDS[top].name}</b></span>) : <span className="face none" />}
      </div>
      <span className="gm-pile-lbl">{label} <b>{ids.length}</b></span>
    </button>
  );
}

// Lista do baralho (sem ordem: a ordem é segredo), das jogadas e do descarte
function DeckView({ me, open, onClose }) {
  const groups = [
    ['deck', 'Baralho (a ordem fica escondida)', [...me.deck].filter(Boolean).sort()],
    ['play', 'Jogadas neste turno', me.play],
    ['discard', 'Descarte', me.discard],
  ];
  return (
    <div className="gm-modal wide" role="dialog" aria-label="Suas cartas">
      <div className="gm-modal-head"><h3>Suas cartas <small>{E.allCards(me).length} no total</small></h3><button type="button" onClick={onClose}>Fechar</button></div>
      {groups.map(([k, title, ids]) => (
        <section key={k} className={`gm-deckgroup${open === k ? ' focus' : ''}`}>
          <h4>{title} <small>({ids.length})</small></h4>
          <div className="gm-cardrow">{ids.length ? ids.map((id, i) => <Card key={`${id}${i}`} id={id} small />) : <p className="gm-empty">Nenhuma.</p>}</div>
        </section>
      ))}
    </div>
  );
}

function Market({ s, myTurn, t, send }) {
  return (
    <div className="gm-shop">
      <h4>Loja especial <small>Fila do Túnel · {s.tunnel.length} no monte</small></h4>
      <div className="gm-shopgrid">
        {s.row.map((id, i) => {
          const c = CARDS[id]; const beast = c.type === 'beast';
          const ok = myTurn && (beast ? t.pic >= c.fight : t.prosa >= c.cost);
          return <Card key={`${id}${i}`} id={id} small onClick={myTurn ? () => send(beast ? { t: 'fight', src: 'row', i } : { t: 'buy', src: 'row', i }) : undefined} disabled={!ok} footer={beast ? `derrotar ⛏${c.fight}` : `comprar 🤝${c.cost}`} />;
        })}
      </div>
      <h4>Loja base <small>sempre disponível</small></h4>
      <div className="gm-shopgrid">
        {Object.keys(s.fixedQty).map((id) => <Card key={id} id={id} small disabled={!myTurn || t.prosa < CARDS[id].cost || s.fixedQty[id] <= 0} onClick={myTurn ? () => send({ t: 'buy', src: 'fixed', id }) : undefined} footer={`🤝${CARDS[id].cost} · restam ${s.fixedQty[id]}`} />)}
        <Card id="RATO" small disabled={!myTurn || t.pic < 2} onClick={myTurn ? () => send({ t: 'fight', src: 'fixed' }) : undefined} footer="⛏2 · sempre aqui" />
      </div>
    </div>
  );
}

function Chat({ list, you, onSend }) {
  const [text, setText] = useState('');
  return (
    <div className="gm-chat">
      <div className="gm-chatlist">{list.slice(-60).map((m, i) => <div key={i} className={m.seat === you ? 'me' : ''}><b>{m.name}:</b> {m.text}</div>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text); setText(''); } }}>
        <input value={text} maxLength={240} placeholder="Mensagem para a mesa" onChange={(e) => setText(e.target.value)} />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default function Game({ s, you, actor, send, top = null, note = null, chat = null, onChat = null }) {
  const [view3d, setView3d] = useState(false);
  const [tab, setTab] = useState('loja');
  const [piles, setPiles] = useState(null);
  const [handOpen, setHandOpen] = useState(true);
  const me = s.players[you];
  const myTurn = actor === you && !s.over && !s.pending.length && E.currentPlayer(s).id === you;
  const waitingMe = actor === you && s.pending.length && s.pending[0].pid === you;
  const t = me?.t || { luz: 0, prosa: 0, pic: 0 };
  const rides = useMemo(() => (myTurn && me && E.inMine(me) && !t.tired && (t.freeRide > 0 || t.luz >= 1) ? E.rideTargets(s, me.node) : {}), [s, myTurn, me, t.tired, t.freeRide, t.luz]);
  const pickNodes = waitingMe && s.pending[0].k === 'grisu' ? E.grisuChoices(s) : null;
  const scores = s.over ? s.players.map((p) => ({ p, sc: E.scoreOf(s, p) })).sort((a, b) => b.sc.total - a.sc.total) : null;
  const TABS = [['loja', 'Loja'], ['mesa', 'Jogadores'], ['diario', 'Diário'], ...(chat ? [['chat', 'Conversa']] : [])];
  const status = s.over ? 'Fim de jogo' : myTurn ? 'Sua vez' : waitingMe ? 'Sua escolha' : actor != null ? `Vez de ${s.players[actor].name}` : '';
  return (
    <div className={`gm-game${myTurn ? ' myturn' : ''}`}>
      <header className="gm-top">
        <div className="gm-brand">GARIMPO <small>A Cova da Mãe-do-Ouro</small></div>
        <Track s={s} />
        <div className="gm-topright">
          <div className="gm-viewsel" role="group" aria-label="Visualização">
            <button type="button" className={view3d ? '' : 'on'} onClick={() => setView3d(false)}>Tabuleiro</button>
            <button type="button" className={view3d ? 'on' : ''} onClick={() => setView3d(true)}>Mesa 3D</button>
          </div>
          {top}
        </div>
      </header>
      <main className="gm-main">
        <section className="gm-board">
          {view3d ? (
            <Suspense fallback={<div className="gm-loading">Montando a mesa…</div>}>
              <Table3D s={s} you={you} myTurn={myTurn} rideTo={rides}
                onMove={(to, ride) => send(ride ? { t: 'ride', to } : { t: 'move', to })}
                onExplore={(dir) => send({ t: 'explore', dir })}
                pickNodes={pickNodes} onPickNode={(node) => send({ t: 'choose', node })} />
            </Suspense>
          ) : (
            <Mine s={s} you={you} myTurn={myTurn} rideTo={rides}
              onMove={(to, ride) => send(ride ? { t: 'ride', to } : { t: 'move', to })}
              onExplore={(dir) => send({ t: 'explore', dir })}
              pickNodes={pickNodes} onPickNode={(node) => send({ t: 'choose', node })} />
          )}
          <div className={`gm-turnflag${myTurn ? ' mine' : ''}`} style={actor != null ? { '--pc': PLAYER_HEX[s.players[actor].color] } : undefined}>{status}</div>
          {myTurn && !view3d && <div className="gm-hint">Clique numa sala com borda dourada para andar, ou num <b>?</b> na borda da sua sala para explorar.</div>}
          {note && <div className="gm-note">{note}</div>}
        </section>
        <aside className="gm-side">
          <div className="gm-tabs" role="tablist">
            {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="gm-tabbody">
            {tab === 'loja' && <Market s={s} myTurn={myTurn} t={t} send={send} />}
            {tab === 'mesa' && <Players s={s} you={you} actor={actor} />}
            {tab === 'diario' && <div className="gm-log">{s.log.slice(-80).reverse().map((l, i) => <div key={i} className={`k-${l.kind}`}>[{l.n}] {l.msg}</div>)}</div>}
            {tab === 'chat' && chat && <Chat list={chat} you={you} onSend={onChat} />}
          </div>
        </aside>
      </main>
      {scores ? (
        <section className="gm-over">
          <h2>Fim de jogo — {scores[0].p.name} venceu</h2>
          <table><thead><tr><th>Garimpeiro</th><th>🟡</th><th>💠</th><th>🏺</th><th>🃏</th><th>🎒</th><th>Selo</th><th>Total</th></tr></thead>
            <tbody>{scores.map(({ p, sc }) => <tr key={p.id} className={s.winners.includes(p.id) ? 'win' : ''}><td><span className="dot" style={{ background: PLAYER_HEX[p.color] }} /> {p.name}{sc.note ? <small> ({sc.note})</small> : null}</td><td>{sc.gold}</td><td>{sc.crystals}</td><td>{sc.relics}</td><td>{sc.cards}</td><td>{sc.items}</td><td>{sc.selo}</td><td><b>{sc.total}</b></td></tr>)}</tbody></table>
        </section>
      ) : me && (
        <footer className="gm-dock">
          <div className="gm-dock-left">
            <div className="gm-pool">
              <span className="gm-res big" title="Luz: movimento">🔦<b>{t.luz}</b></span>
              <span className="gm-res big" title="Prosa: compra cartas">🤝<b>{t.prosa}</b></span>
              <span className="gm-res big" title="Picareta: Bichos, Tocas, desabamentos">⛏<b>{t.pic}</b></span>
              <span className="gm-res" title="Barulho deste turno: vira cubos na Bateia no fim do turno">💥 {Math.max(0, me.area || 0)}</span>
              <span className="gm-res" title="Fôlego">🫧 {me.folego}/{MAX_FOLEGO}</span>
              <span className="gm-res" title="Pepitas">🟡 {me.gold}</span>
              {t.tired && <span className="gm-res warn" title="Você entrou num Geodo: acabou o movimento deste turno">😵 cansado</span>}
            </div>
            {E.inMine(me) ? (
              <>
                {myTurn && <Actions s={s} me={me} send={send} />}
                <div className="gm-dock-buttons">
                  <button type="button" onClick={() => send({ t: 'playAll' })} disabled={!myTurn || !me.hand.length}>Jogar todas</button>
                  <button type="button" className="hot end" onClick={() => send({ t: 'end' })} disabled={!myTurn}>Encerrar turno</button>
                </div>
              </>
            ) : <p className="gm-wait">{me.status === 'out' ? '🏁 Você saiu da mina. No seu turno saem cubos da Bateia.' : '🪦 Você ficou soterrado.'}</p>}
          </div>
          <div className={`gm-handwrap${handOpen ? '' : ' closed'}`}>
            <div className="gm-hand-head">
              <h4>{myTurn ? 'Sua mão' : 'Sua próxima mão'} <small>{me.hand.length} carta(s){myTurn ? ' · clique para jogar' : ''}</small></h4>
              <button type="button" className="gm-link" onClick={() => setHandOpen((v) => !v)}>{handOpen ? 'recolher' : 'mostrar a mão'}</button>
            </div>
            {handOpen && (
              <div className="gm-fan">
                {me.hand.map((id, i) => (
                  <div key={`${id}${i}`} className="gm-fancell" style={{ '--i': i - (me.hand.length - 1) / 2, '--n': me.hand.length }}>
                    <Card id={id} onClick={myTurn ? () => send({ t: 'play', hi: i }) : undefined} />
                  </div>
                ))}
                {!me.hand.length && <p className="gm-empty">Mão vazia — no fim do turno você compra 5.</p>}
              </div>
            )}
          </div>
          <div className="gm-piles">
            <Pile label="Baralho" ids={me.deck} hidden onOpen={() => setPiles('deck')} />
            <Pile label="Jogadas" ids={me.play} onOpen={() => setPiles('play')} />
            <Pile label="Descarte" ids={me.discard} onOpen={() => setPiles('discard')} />
          </div>
        </footer>
      )}
      {piles && me && <DeckView me={me} open={piles} onClose={() => setPiles(null)} />}
      <Pending s={s} you={you} send={send} />
    </div>
  );
}
