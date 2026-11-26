// GARIMPO — página do jogo: tela inicial, partida local contra bots e partida online.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as E from './engine.js';
import { botTurn } from './bot.js';
import { DLCS } from './data.js';
import { actor as actorOf } from './online/view.js';
import { useOnline, loadName, recentRooms } from './online/useOnline.js';
import Game from './ui/Game.jsx';
import { art, asset } from './ui/text.js';

const BOT_DELAY = 700;

const DLC_ART = { cerbero: 'boss_cerbero', medusa: 'boss_medusa' };
const DLC_TXT = {
  cerbero: 'Um cão de três cabeças guarda um portão no fundo e persegue quem carrega Relíquia.',
  medusa: 'A górgona anda pelos túneis; quem ela olha vai virando pedra no baralho.',
};

function Options({ dlc, setDlc, map, setMap }) {
  return (
    <div className="gm-opts">
      <div className="gm-optblock">
        <h4>Expansões</h4>
        <div className="gm-dlcs">
          {Object.entries(DLCS).map(([k, d]) => {
            const on = dlc.includes(k);
            return (
              <button key={k} type="button" className={`gm-dlc${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setDlc(on ? dlc.filter((x) => x !== k) : [...dlc, k])}>
                <span className="art" style={{ backgroundImage: `url(${art(DLC_ART[k])})` }} />
                <span className="txt"><b>{d.name}</b><small>{DLC_TXT[k]}</small></span>
                <span className="chk">{on ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="gm-optblock">
        <h4>Mapa</h4>
        <div className="gm-seg">
          <button type="button" className={map === 'explorar' ? 'on' : ''} onClick={() => setMap('explorar')}>Explorar<small>a mina aparece peça por peça</small></button>
          <button type="button" className={map === 'classico' ? 'on' : ''} onClick={() => setMap('classico')}>Clássico<small>mapa fixo, bom para aprender</small></button>
        </div>
      </div>
    </div>
  );
}

function HowTo() {
  return (
    <details className="gm-howto">
      <summary>Como jogar em 1 minuto</summary>
      <ol>
        <li><b>Monte o baralho:</b> jogue as 5 cartas da mão. 🤝 compra cartas na loja base ou na Fila, 🔦 anda, ⛏ derrota Bichos.</li>
        <li><b>Explore:</b> numa saída <b>?</b> da sua sala, pague a passagem, compre uma peça da mina e escolha como girar.</li>
        <li><b>Barulho:</b> 💥 põe seus cubos na Bateia. Quando sai 🌋 na Fila ou alguém pega Relíquia, a Mãe-do-Ouro acorda e seus cubos sorteados viram dano no seu Fôlego.</li>
        <li><b>Saia vivo:</b> pegue uma Relíquia nos Altares e volte à Boca (Selo ✦20). Depois disso, no seu turno saem cubos da Bateia contra quem ficou.</li>
        <li><b>Ganha quem tiver mais pontos.</b> Soterrado no fundo ou sem Relíquia faz 0.</li>
      </ol>
    </details>
  );
}

function Start({ onLocal, onOnline }) {
  const [name, setName] = useState(loadName() || 'Garimpeiro');
  const [bots, setBots] = useState(3);
  const [dlc, setDlc] = useState([]);
  const [map, setMap] = useState('explorar');
  return (
    <div className="gm-start" style={{ backgroundImage: `linear-gradient(90deg, rgba(20,16,12,.94) 0%, rgba(20,16,12,.82) 42%, rgba(20,16,12,.25) 100%), url(${asset('capa.webp')})` }}>
      <div className="gm-startbox">
        <div className="gm-logo">
          <h1>GARIMPO</h1>
          <p className="sub">A Cova da Mãe-do-Ouro</p>
          <p className="pitch">Monte o seu baralho, desça na mina descobrindo peça por peça, pegue uma Relíquia e saia antes que o barulho acorde a Mãe-do-Ouro.</p>
        </div>
        <label className="gm-field">Seu nome <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} /></label>
        <div className="gm-modes">
          <div className="gm-mode">
            <h3>🤖 Contra bots</h3>
            <p>Joga aqui mesmo, no navegador.</p>
            <div className="gm-seg small" role="group" aria-label="Quantos bots">
              {[0, 1, 2, 3].map((n) => <button key={n} type="button" className={bots === n ? 'on' : ''} onClick={() => setBots(n)}>{n === 0 ? 'Solo' : `${n} bot${n > 1 ? 's' : ''}`}</button>)}
            </div>
            <button type="button" className="hot big" onClick={() => onLocal({ name, bots, dlc, map })}>Jogar agora</button>
          </div>
          <div className="gm-mode">
            <h3>🌐 Online</h3>
            <p>Crie uma sala e mande o código para até 3 amigos. Vagas livres viram bots.</p>
            <button type="button" className="big" onClick={() => onOnline(name)}>Criar ou entrar numa sala</button>
          </div>
        </div>
        <Options dlc={dlc} setDlc={setDlc} map={map} setMap={setMap} />
        <HowTo />
      </div>
    </div>
  );
}

// Partida local: o estado fica no navegador; os bots jogam um turno de cada vez, com pausa
function Local({ cfg, onExit }) {
  const [s, setS] = useState(() => E.newGame({ players: [{ name: cfg.name || 'Você' }, ...Array.from({ length: cfg.bots }, (_, i) => ({ name: ['Bot Tião', 'Bot Zefa', 'Bot Benedito'][i], bot: true }))], dlc: cfg.dlc, map: cfg.map }));
  const [err, setErr] = useState(null);
  const timer = useRef(null);
  const send = useCallback((cmd) => {
    setS((cur) => {
      const next = structuredClone(cur);
      const e = E.exec(next, cmd, 0);
      if (e) { setErr(e); return cur; }
      setErr(null);
      return next;
    });
  }, []);
  const actor = actorOf(s);
  useEffect(() => {
    if (s.over || actor == null || !s.players[actor].bot) return undefined;
    timer.current = setTimeout(() => {
      setS((cur) => {
        const g = structuredClone(cur);
        const who = actorOf(g);
        if (who == null || !g.players[who].bot) return cur;
        if (g.pending.length) E.exec(g, E.defaultChoice(g), who); else botTurn(g);
        return g;
      });
    }, BOT_DELAY);
    return () => clearTimeout(timer.current);
  }, [s, actor]);
  return <Game s={s} you={0} actor={actor} send={send} note={err} top={<button type="button" onClick={onExit}>Sair</button>} />;
}

function Lobby({ on }) {
  const l = on.lobby;
  const host = l.you === l.host;
  return (
    <div className="gm-lobby">
      <h2>Sala {l.code}</h2>
      <p>Mande este código para os amigos: <b className="gm-code">{l.code}</b></p>
      <ul>{l.seats.map((s, i) => <li key={i}>{s.name}{s.bot ? ' 🤖' : ''}{s.host ? ' (anfitrião)' : ''}{!s.online ? ' · desconectado' : ''}{host && !s.host ? <button type="button" onClick={() => on.act('remove', { seat: i })}>remover</button> : null}</li>)}</ul>
      {host ? (
        <>
          <div className="gm-opts">
            <div><h4>Expansões</h4>{Object.entries(l.dlcs || {}).map(([k, n]) => <label key={k}><input type="checkbox" checked={l.opts.dlc.includes(k)} onChange={(e) => on.act('opts', { dlc: e.target.checked ? [...l.opts.dlc, k] : l.opts.dlc.filter((x) => x !== k) })} /> {n}</label>)}</div>
            <div><h4>Mapa</h4>{['explorar', 'classico'].map((m) => <label key={m}><input type="radio" checked={l.opts.map === m} onChange={() => on.act('opts', { map: m })} /> {m === 'explorar' ? 'Explorar' : 'Clássico'}</label>)}</div>
          </div>
          <div className="gm-startrow">
            <button type="button" disabled={l.seats.length >= 4} onClick={() => on.act('addBot')}>+ Bot</button>
            <button type="button" className="hot" onClick={() => on.act('start')}>Começar</button>
          </div>
        </>
      ) : <p>Esperando o anfitrião começar. Expansões: {l.opts.dlc.map((k) => l.dlcs?.[k]).join(', ') || 'nenhuma'} · mapa {l.opts.map}.</p>}
      <button type="button" onClick={on.leave}>Sair da sala</button>
    </div>
  );
}

function Online({ name, onExit }) {
  const on = useOnline();
  const [code, setCode] = useState('');
  const recent = recentRooms();
  if (on.state) {
    const st = on.state;
    const host = st.host === st.you;
    const top = (
      <>
        <span className="gm-code">{st.code}</span>
        {host && st.view.over && <button type="button" onClick={() => on.act('rematch')}>Revanche</button>}
        {host && st.presence.map((p, i) => (!p ? <button key={i} type="button" onClick={() => on.act('botify', { seat: i })}>Bot no lugar de {st.view.players[i].name}</button> : null))}
        <button type="button" onClick={() => { on.leave(); onExit(); }}>Sair</button>
      </>
    );
    const note = [on.error?.msg, on.botNote ? `${st.view.players[on.botNote.who]?.name}: ${on.botNote.lines.join(' · ')}` : null, on.conn !== 'open' ? 'Reconectando…' : null].filter(Boolean).join(' — ') || null;
    return <Game s={st.view} you={st.you} actor={st.actor} send={on.send} top={top} note={note} chat={on.chat} onChat={on.sendChat} />;
  }
  return (
    <div className="gm-start" style={{ backgroundImage: `linear-gradient(90deg, rgba(20,16,12,.94) 0%, rgba(20,16,12,.82) 42%, rgba(20,16,12,.25) 100%), url(${asset('capa.webp')})` }}>
      <div className="gm-startbox online">
        <h1>GARIMPO online</h1>
        <p className="sub">{on.conn === 'open' ? 'Conectado' : 'Conectando ao servidor…'}</p>
        {on.gone && <p className="gm-err">{on.gone}</p>}
        {on.error && <p className="gm-err">{on.error.msg}</p>}
        {on.lobby ? <Lobby on={on} /> : (
          <>
            <div className="gm-startrow">
              <button type="button" className="hot" onClick={() => on.create(name)}>Criar sala</button>
              <input placeholder="CÓDIGO" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <button type="button" disabled={code.length < 6} onClick={() => on.join(code, name)}>Entrar</button>
            </div>
            {recent.length > 0 && <div className="gm-recent">Voltar para: {recent.map((r) => <button key={r.code} type="button" onClick={() => on.resume(r.code)}>{r.code}</button>)}</div>}
          </>
        )}
        <button type="button" onClick={onExit}>Voltar</button>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(null);
  if (mode?.local) return <Local cfg={mode.local} onExit={() => setMode(null)} />;
  if (mode?.online) return <Online name={mode.online} onExit={() => setMode(null)} />;
  return <Start onLocal={(cfg) => setMode({ local: cfg })} onOnline={(name) => setMode({ online: name })} />;
}
