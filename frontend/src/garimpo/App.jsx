// GARIMPO — página do jogo: tela inicial, partida local contra bots e partida online.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as E from './engine.js';
import { botTurn } from './bot.js';
import { DLCS } from './data.js';
import { actor as actorOf } from './online/view.js';
import { useOnline, loadName, recentRooms } from './online/useOnline.js';
import Game from './ui/Game.jsx';
import { asset } from './ui/text.js';

const BOT_DELAY = 700;

function Options({ dlc, setDlc, map, setMap }) {
  return (
    <div className="gm-opts">
      <div>
        <h4>Expansões</h4>
        {Object.entries(DLCS).map(([k, d]) => (
          <label key={k}><input type="checkbox" checked={dlc.includes(k)} onChange={(e) => setDlc(e.target.checked ? [...dlc, k] : dlc.filter((x) => x !== k))} /> {d.name}</label>
        ))}
      </div>
      <div>
        <h4>Mapa</h4>
        <label><input type="radio" checked={map === 'explorar'} onChange={() => setMap('explorar')} /> Explorar (salas descobertas durante o jogo)</label>
        <label><input type="radio" checked={map === 'classico'} onChange={() => setMap('classico')} /> Clássico (mapa fixo, bom para aprender)</label>
      </div>
    </div>
  );
}

function Start({ onLocal, onOnline }) {
  const [name, setName] = useState(loadName() || 'Garimpeiro');
  const [bots, setBots] = useState(3);
  const [dlc, setDlc] = useState([]);
  const [map, setMap] = useState('explorar');
  return (
    <div className="gm-start" style={{ backgroundImage: `url(${asset('capa.webp')})` }}>
      <div className="gm-startbox">
        <h1>GARIMPO</h1>
        <p className="sub">A Cova da Mãe-do-Ouro</p>
        <p>Monte o seu baralho, desça na mina descobrindo salas, pegue uma Relíquia e saia antes que o barulho acorde a Mãe-do-Ouro ou a água suba.</p>
        <label className="gm-field">Seu nome <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} /></label>
        <Options dlc={dlc} setDlc={setDlc} map={map} setMap={setMap} />
        <div className="gm-startrow">
          <label className="gm-field">Bots <select value={bots} onChange={(e) => setBots(Number(e.target.value))}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <button type="button" className="hot" onClick={() => onLocal({ name, bots, dlc, map })}>Jogar aqui</button>
          <button type="button" onClick={() => onOnline(name)}>Jogar online</button>
        </div>
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
    return <Game s={st.view} you={st.you} actor={st.actor} send={on.send} top={top} note={note} />;
  }
  return (
    <div className="gm-start" style={{ backgroundImage: `url(${asset('capa.webp')})` }}>
      <div className="gm-startbox">
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
