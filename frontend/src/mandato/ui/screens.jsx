import { Glossary } from './explain.jsx';
import { useState } from 'react';
import { TERRAINS, RIVAL, ZONES, PLAYER_COLORS, FACTIONS, FAC_KEYS, CARGOS, packageFor } from '../data.js';
import { calc, MAX_ROUNDS, actor } from '../engine.js';
import { DURATIONS, DEFAULT_TARGET, CITY_MARKS, LAND, MANDATE, PARTY_REVIEW } from '../data.js';
import { Ico, Rich, TerrainGlyph } from './icons.jsx';
import { artUrl, terrainMap } from './cardutil.js';

const SHOWCASE = ['E1-01', 'E1-02', 'E1-03', 'E1-06', 'E1-05', 'E1-07'];

// ---------------------------------------------------------------- abertura

export function Home({ onSolo, onLocal, onOnline, onRules, onTutorial, saved, onContinue }) {
  return (
    <main className="home">
      <div className="home-sheet">
        <div className="home-meta">
          <span className="stamp">Relatório oficial nº 60</span>
          <span>Departamento de Planejamento Urbano do Partido</span>
          <span>Uso interno — 1 a 6 prefeitos</span>
        </div>
        <h1 className="logo">MANDATO<span className="logo-star"><Ico n="star" s={54} /></span></h1>
        <p className="logo-sub">A Ascensão do Prefeito</p>
        <p className="home-pitch">
          Você é prefeito de uma cidade que ninguém conhece. O Partido está olhando. Construa melhor, mais rápido
          e com menos escândalos do que seus rivais — e suba até o topo.
        </p>
        <div className="home-strip" aria-hidden="true">
          {SHOWCASE.map((id, i) => <img key={id} src={artUrl(id)} alt="" style={{ '--r': `${(i - 2.5) * 1.6}deg` }} draggable="false" />)}
        </div>
        <div className="home-actions">
          <button type="button" className="btn btn-primary" onClick={onSolo}>
            <b>Solo</b><span>contra o Rival</span>
          </button>
          <button type="button" className="btn btn-primary alt" onClick={onLocal}>
            <b>Partida local</b><span>2 a 6 prefeitos · humanos e bots</span>
          </button>
          <button type="button" className="btn btn-primary online" onClick={onOnline}>
            <b>Jogar online</b><span>crie uma sala e convide amigos</span>
          </button>
          {saved && (
            <button type="button" className="btn" onClick={onContinue}>
              <b>Continuar</b><span>rodada {saved.round || 1} · {saved.solo ? 'solo' : `${saved.players.length} jogadores`}</span>
            </button>
          )}
          {onTutorial && <button type="button" className="btn btn-primary tut" onClick={onTutorial}><b>Tutorial</b><span>partida guiada, primeira vez</span></button>}
          <button type="button" className="btn btn-ghost" onClick={onRules}>Como jogar</button>
        </div>
        <ul className="home-facts">
          <li><Ico n="star" s={18} /> Primeiro a chegar a ⭐10 vence</li>
          <li><Ico n="cube" s={18} /> Corrupção rende rápido… até a Fiscalização</li>
          <li><Ico n="tec" s={18} /> 4 Facções · 6 terrenos · 60 cartas especiais</li>
        </ul>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------- configuração

export function Setup({ mode, onBack, onStart }) {
  const solo = mode === 'solo';
  const [level, setLevel] = useState('normal');
  const [target, setTarget] = useState(solo ? 10 : DEFAULT_TARGET);
  const [noIntrigues, setNoIntrigues] = useState(false);
  const [seats, setSeats] = useState([
    { name: 'Prefeito(a) 1', bot: false }, { name: 'Bot Alfa', bot: true }, { name: 'Bot Beta', bot: true },
  ]);
  const [name, setName] = useState('Prefeito(a)');
  const setSeat = (i, patch) => setSeats((a) => a.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const addSeat = () => seats.length < 6 && setSeats((a) => [...a, { name: `Bot ${['Gama', 'Delta', 'Épsilon'][a.length - 3] || a.length + 1}`, bot: true }]);
  const delSeat = (i) => seats.length > 2 && setSeats((a) => a.filter((_, k) => k !== i));
  const humans = seats.filter((x) => !x.bot).length;
  const valid = solo || humans >= 1;
  return (
    <main className="setup">
      <button type="button" className="back" onClick={onBack}>← Voltar</button>
      <h2>{solo ? 'Solo · contra o Rival' : 'Partida local'}</h2>
      <p className="lead">
        {solo
          ? 'Você joga normalmente, mas disputa a hierarquia do Partido contra o Rival, um prefeito automatizado que avança sozinho.'
          : 'Todos jogam neste aparelho, em turnos. Com mais de um humano, uma cortina esconde a sua mão enquanto o aparelho passa de mão em mão. Bots completam os assentos.'}
      </p>

      {solo ? (
        <section className="sec">
          <label className="lab">Seu nome</label>
          <input className="inp" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} />
          <label className="lab">Dificuldade do Rival</label>
          <div className="levels">
            {Object.entries(RIVAL).map(([k, v]) => (
              <button type="button" key={k} className={`level${level === k ? ' on' : ''}`} onClick={() => setLevel(k)}>
                <b>{v.name}</b><span>{v.t}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="sec">
          <label className="lab">Assentos <small>a ordem define a escolha de terreno; o último joga primeiro na rodada 1 e recebe um pacote de compensação</small></label>
          <ul className="seats">
            {seats.map((x, i) => (
              <li key={i}>
                <i className="disc" style={{ background: PLAYER_COLORS[i] }} />
                <input className="inp" value={x.name} maxLength={22} onChange={(e) => setSeat(i, { name: e.target.value })} aria-label={`Nome do assento ${i + 1}`} />
                <div className="seg">
                  <button type="button" className={!x.bot ? 'on' : ''} onClick={() => setSeat(i, { bot: false })}>Humano</button>
                  <button type="button" className={x.bot ? 'on' : ''} onClick={() => setSeat(i, { bot: true })}>Bot</button>
                </div>
                {x.bot ? (
                  <select className="lvl" value={x.level || 'normal'} onChange={(e) => setSeat(i, { level: e.target.value })} aria-label={`Nível do bot ${i + 1}`} title="Fácil erra de propósito; Difícil joga para o Partido e recebe +💰2 por turno">
                    {[['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                ) : <span />}
                <button type="button" className="x" onClick={() => delSeat(i)} disabled={seats.length <= 2} aria-label="Remover assento">×</button>
              </li>
            ))}
          </ul>
          {seats.length < 6 && <button type="button" className="btn btn-ghost sm" onClick={addSeat}>+ Adicionar assento</button>}
        </section>
      )}

      <section className="sec two">
        <div>
          <label className="lab">Duração</label>
          <div className="seg wide">
            {(solo ? [[8, 'Curto · ⭐8'], [10, 'Padrão · ⭐10'], [12, 'Épico · ⭐12']] : DURATIONS.map((d) => [d.target, `${d.label} · ⭐${d.target} · ${d.mandates} mandatos`])).map(([n, l]) => (
              <button type="button" key={n} className={target === n ? 'on' : ''} onClick={() => setTarget(n)}>{l}</button>
            ))}
          </div>
        </div>
        {!solo && (
          <div>
            <label className="lab">Variante</label>
            <label className="chk"><input type="checkbox" checked={noIntrigues} onChange={(e) => setNoIntrigues(e.target.checked)} /> Sem Intrigas <small>(remove as 10 cartas de interação negativa)</small></label>
          </div>
        )}
      </section>

      <button
        type="button"
        className="btn btn-primary go"
        disabled={!valid}
        onClick={() => onStart(solo
          ? { solo: true, level, target, noIntrigues: true, players: [{ name: name.trim() || 'Prefeito(a)', bot: false }] }
          : { solo: false, target, noIntrigues, players: seats.map((x) => ({ name: x.name.trim() || 'Jogador', bot: x.bot, botLevel: x.level || 'normal' })) })}
      >
        {solo ? 'Escolher terreno' : 'Iniciar draft de terrenos'}
      </button>
      {!valid && <p className="warn">Inclua ao menos um humano.</p>}
    </main>
  );
}

// ---------------------------------------------------------------- draft de terreno

export function TerrainPreview({ id }) {
  const T = TERRAINS[id];
  if (T.island) {
    return (
      <div className="tp tp-island" aria-hidden="true">
        {T.tiles.map((t, i) => {
          const o = { M: [0, 0], N: [4, 0], L: [4, 3] }[t.isl];
          return <i key={i} className="mt k-C" style={{ gridColumn: t.x + o[0] + 1, gridRow: t.y + o[1] + 1 }}>{i === 4 ? 'P' : i === 5 ? 'H' : ''}</i>;
        })}
      </div>
    );
  }
  const map = terrainMap(id);
  return (
    <div className={`tp${map ? ' tp-map' : ''}`} style={map ? { '--map': `url(${map})` } : undefined} aria-hidden="true">
      {T.grid.map((k, i) => <i key={i} className={`mt k-${k === 'P' || k === 'H' ? '.' : k}`}>{k === 'P' || k === 'H' ? k : ''}</i>)}
    </div>
  );
}

function Stars({ n }) { return <span className="stars" aria-label={`${n} de 5`}>{'★'.repeat(n)}<s>{'★'.repeat(5 - n)}</s></span>; }

export function Draft({ s, viewer, onPick }) {
  const act = actor(s);
  const picker = s.players[act];
  const mine = !!picker && !picker.bot && picker.id === viewer;
  const pk = (seat) => { const k = packageFor(s.players.length, seat); const parts = [k.treasury && `+💰${k.treasury} no Tesouro`, k.appr && `+${k.appr} 😊`].filter(Boolean); return parts.length ? parts.join(' e ') : 'Sem pacote'; };
  return (
    <main className="draft">
      <h2>Draft de terrenos</h2>
      <p className="lead">
        {s.solo
          ? 'Escolha o terreno da sua cidade. O Rival usará um terreno aleatório.'
          : <>Na ordem dos assentos, cada prefeito escolhe 1 terreno. Vez de <b style={{ color: picker.color }}>{picker.name}</b>{' '}
            <span className="pkg">({pk(picker.seat)})</span>.</>}
      </p>
      {!s.solo && (
        <ol className="order">
          {s.players.map((p) => (
            <li key={p.id} className={p.id === act ? 'now' : p.terrain ? 'done' : ''}>
              <i className="disc" style={{ background: p.color }} /> {p.name} {p.terrain ? `— ${TERRAINS[p.terrain].name}` : ''}
            </li>
          ))}
        </ol>
      )}
      <div className="terrains">
        {s.draft.pool.map((id) => {
          const T = TERRAINS[id];
          return (
            <article key={id} className="terrain" style={{ '--tc': T.color }}>
              <header><span className="tg"><TerrainGlyph id={id} s={26} color="#1B2A41" /></span><div><h3>{T.name}</h3><small>{T.sub}</small></div></header>
              <TerrainPreview id={id} />
              <div className="cap"><Ico n="e" s={16} /> {T.cap.e} <Ico n="w" s={16} /> {T.cap.w} <span className="cap-note">capacidade inicial</span></div>
              <p className="tr up"><b>▲ {T.trait}.</b> <Rich t={T.traitT} s={13} /></p>
              <p className="tr down"><b>▼ {T.weak}.</b> <Rich t={T.weakT} s={13} /></p>
              <p className="style">{T.style}</p>
              <dl className="tstars">
                <dt>Economia</dt><dd><Stars n={T.stars.eco} /></dd>
                <dt>Construção</dt><dd><Stars n={T.stars.con} /></dd>
                <dt>Infra</dt><dd><Stars n={T.stars.inf} /></dd>
                <dt>Risco</dt><dd>{T.risk}</dd>
                <dt>Complexidade</dt><dd>{T.cx}</dd>
              </dl>
              <p className="rg"><Ico n="star" s={15} /> <b>Meta Regional · {T.regionalGoal.name}:</b> <Rich t={T.regionalGoal.t} s={13} /></p>
              <button type="button" className="btn btn-primary" disabled={!mine} onClick={() => onPick(id)}>{mine ? 'Escolher' : 'Aguardando…'}</button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------- cortina (hotseat)

export function Curtain({ name, color, why, onOk }) {
  return (
    <div className="curtain" role="dialog" aria-modal="true">
      <div className="curtain-card">
        <span className="stamp">Confidencial</span>
        <i className="disc big" style={{ background: color }} />
        <h2>Passe o aparelho para {name}</h2>
        <p>{why}</p>
        <button type="button" className="btn btn-primary" onClick={onOk}>Sou {name}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- regras

export function Rules({ onClose }) {
  // glossário importado de explain.jsx
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Como jogar">
      <div className="modal-card rules">
        <button type="button" className="x close" onClick={onClose} aria-label="Fechar">×</button>
        <h2>Como jogar</h2>
        <section>
          <h3>Siglas e símbolos</h3>
          <Glossary />
        </section>
        <section>
          <h3>Objetivo</h3>
          <p>Chegue à <b>meta de Mérito</b> da partida (⭐{DURATIONS.map((d) => d.target).join(' / ⭐')} conforme a duração; ⭐10 no solo) antes dos outros. Quando alguém chega lá, a rodada em andamento é completada e vence quem tiver mais ⭐ (desempate: maior 😊 → menor ☁️ → maior Tesouro). Se ninguém chegar, a última rodada ({DURATIONS.map((d) => d.rounds).join(' / ')}; {MAX_ROUNDS} no solo) encerra o jogo.</p>
          <p><b>Mandatos e Avaliação do Partido:</b> a partida tem {DURATIONS.map((d) => d.mandates).join(' / ')} mandatos de {MANDATE} rodadas. No fim de cada mandato o Partido avalia os prefeitos por <b>😊×2 + edifícios ativos</b>: o 1º ganha ⭐{PARTY_REVIEW.first} e o 2º ⭐{PARTY_REVIEW.second} (com 3+ prefeitos; empate no topo dá ⭐1 a cada um). Depois o Partido confere as contas: o Saco é sorteado com Tensão +1. O próximo mandato começa pelo pior avaliado.</p>
          <p><b>Bots:</b> <b>Fácil</b> erra de propósito (casas e compras ao acaso, não compra terreno nem usa Obras-Prima e Decretos, esquece Metas); <b>Normal</b> é o bot padrão; <b>Difícil</b> joga para a Avaliação do Partido e os Marcos da Cidade, protege a ficha no Saco e recebe <b>+💰2</b> no início de cada turno.</p>
          <p><b>Marcos da Cidade</b> (⭐1 cada, uma vez): {CITY_MARKS.map((m) => m.label).join(' · ')}. <b>Comprar terreno:</b> 1 por turno, vizinho da sua cidade, até a grade 5×5 (💰{LAND.base}, depois +💰{LAND.step} a cada compra).</p>
        </section>
        <section>
          <h3>Seu turno</h3>
          <ol>
            <li><b>Início:</b> você recebe a renda da cidade (Prefeitura 💰1 + edifícios ativos + Decretos + Tesouro). Cada ⚡/💧 faltando custa −1 😊 (máx. −3). Com 😊 ≥ 8, +🗳️1.</li>
            <li><b>Ação</b> (qualquer ordem): jogue cartas da mão para ganhar 💰 Verba, 🔨 Obra e 🗳️ Articulação; compre cartas (vão ao descarte); construa Edificações da mão numa casa da grade; faça Melhorias, Demolições, Vender Lote; construa Obras-Prima; reivindique 1 Meta; troque 2 Selos por ⭐1; assine Decretos; use 1 Intriga.</li>
            <li><b>Fim:</b> a mão e as cartas jogadas vão ao descarte, até 3 💰 ficam no Tesouro (🔨 e 🗳️ evaporam) e você compra 5 cartas (4 com Protestos 😊 ≤ 2). Como a mão é comprada no fim do turno, você já a conhece durante os turnos dos outros.</li>
          </ol>
        </section>
        <section>
          <h3>A cidade é o jogo</h3>
          <p><b>Construir tira a carta do seu deck</b> e a coloca na grade como renda permanente. Cada Edificação tem custo de obra (Ob), consumo de ⚡/💧 (Cons), população mínima (Req 👥) e ☁️ de poluição. Edifícios com Req não cumprido ficam <i>inativos</i>. Vizinhança é ortogonal (sem diagonais). Casas especiais do terreno (Orla, Encosta, Jazida, Rio, Duna, Oásis, Floresta) mudam custos e rendas.</p>
        </section>
        <section>
          <h3>Mercado</h3>
          <p>4 pilhas Padrão (sempre disponíveis), a Fila Especial de 6 cartas (reposta do Deck Especial, em 3 Tiers que "envelhecem") e a vitrine de Obras-Prima (💰🔨🗳️ para ⭐2 — só 2 por jogador pontuam). Cartas com 🔔 que entram na Fila disparam uma Fiscalização.</p>
        </section>
        <section>
          <h3>Fiscalização e Suspeita</h3>
          <p>Cartas corruptas põem seus cubos 🕵️ no <b>Saco</b>. Numa Fiscalização, sorteiam-se <b>Tensão</b> cubos (3, 4, 5, 6 conforme as rodadas): cada cubo seu custa −1 😊. Com 3 ou mais de uma vez: <b>Investigação</b> (−⭐1 e sem Metas na rodada). Aprovação 0 = Crise de Governo (−⭐1, 😊 volta a 3).</p>
        </section>
        <section>
          <h3>Caminhos para ⭐</h3>
          <ul>
            <li><b>Metas do Partido:</b> Ouro ⭐2 para o 1º, Prata ⭐1 para o 2º; 1 por turno. Cada terreno tem também uma Meta Regional privada (⭐2).</li>
            <li><b>Obras-Prima:</b> ⭐2 cada (no máximo 2 contam).</li>
            <li><b>Facções:</b> marco em 3 (⭐1) e Aliança em ≥5 sendo o único mais alto (⭐1 e bônus).</li>
            <li><b>Auditoria:</b> o 1º de cada rodada ganha um Selo; 2 Selos = ⭐1.</li>
          </ul>
        </section>
        <section>
          <h3>Cargos</h3>
          <ul className="cargos">{CARGOS.map((c) => <li key={c.name}><b>⭐{c.min}+</b> {c.name}{c.fx && <> — <Rich t={c.fx} s={13} /></>}</li>)}</ul>
        </section>
        <section>
          <h3>Atalhos</h3>
          <p><kbd>E</kbd> encerrar turno · <kbd>Esc</kbd> cancelar · <kbd>1</kbd>–<kbd>5</kbd> selecionar carta da mão · clique duplo numa carta de ação para jogá-la.</p>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- fim de jogo

export function GameOver({ s, onAgain, againLabel = 'Jogar de novo', onView, extra }) {
  const ranked = [...s.players].sort((a, b) => b.merit - a.merit || b.approval - a.approval);
  const win = s.winners.length > 0;
  const src = Object.entries(s.stats.src).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...src.map((x) => x[1]));
  const you = s.solo ? s.players[0] : null;
  return (
    <div className="modal over" role="dialog" aria-modal="true">
      <div className="modal-card over-card">
        <span className="stamp big">{s.solo ? (win ? 'Aprovado' : 'Reprovado') : 'Encerrado'}</span>
        <p className="over-k">Fim do mandato · rodada {s.round}</p>
        <h2>
          {s.solo
            ? (win ? 'Você subiu na hierarquia do Partido!' : 'O Rival chegou primeiro.')
            : `${s.winners.map((w) => s.players[w].name).join(' e ')} ${s.winners.length > 1 ? 'dividem a vitória' : 'sobe na hierarquia do Partido'}!`}
        </h2>
        <p className="over-s">{s.reason}</p>
        <ol className="rank">
          {ranked.map((p) => {
            const c = calc(s, p);
            return (
              <li key={p.id} className={s.winners.includes(p.id) ? 'win' : ''}>
                <i className="disc" style={{ background: p.color }} />
                <span className="rn">{p.name}<small>{TERRAINS[p.terrain].name} · 😊{p.approval} · 👥{c.pop} · ☁️{c.poll} · 🏗️{c.built}</small></span>
                <b><Ico n="star" s={18} /> {p.merit}</b>
              </li>
            );
          })}
          {s.solo && <li className={!win ? 'win' : ''}><i className="disc rival">R</i><span className="rn">O Rival<small>{RIVAL[s.level].name}</small></span><b><Ico n="star" s={18} /> {s.rival.merit}</b></li>}
        </ol>
        {src.length > 0 && (
          <div className="srcs">
            <h4>Fontes de ⭐ nesta partida</h4>
            {src.map(([k, v]) => <div key={k} className="src"><span>{k}</span><i style={{ width: `${(v / max) * 100}%` }} /><b>{v}</b></div>)}
          </div>
        )}
        <p className="over-s">Fiscalizações: {s.stats.fisc} · Investigações: {s.stats.invest} · Crises de Governo: {s.stats.crises}{you ? ` · suas Crises: ${you.crises}` : ''}</p>
        <div className="over-acts">
          {extra}
          {onView && <button type="button" className="btn" onClick={onView}>Ver a mesa</button>}
          <button type="button" className={`btn${extra ? ' btn-ghost' : ' btn-primary'}`} onClick={onAgain}>{againLabel}</button>
        </div>
      </div>
    </div>
  );
}

export { ZONES, FACTIONS, FAC_KEYS };
