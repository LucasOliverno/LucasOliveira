import { useState } from 'react';
import { PLAYER_COLORS } from '../data.js';
import { useOnline, loadName, savedRoom, recentRooms, forgetRoom } from '../online/useOnline.js';
import Game from './Game.jsx';
import { Chat } from './chat.jsx';
import { Rules } from './screens.jsx';

const inviteLink = (code) => `${location.origin}/mandato/?sala=${code}`;

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* sem permissão: tenta o método antigo */ }
  try {
    const t = document.createElement('textarea');
    t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  } catch { return false; }
}

function ConnBadge({ conn }) {
  if (conn === 'open') return <span className="conn ok">● conectado</span>;
  return <span className="conn bad">● {conn === 'connecting' ? 'conectando ao servidor…' : 'sem conexão — tentando de novo…'}</span>;
}

function Entry({ o, onExit, initialCode }) {
  const [name, setName] = useState(loadName);
  const [code, setCode] = useState((initialCode || '').toUpperCase());
  const [skip, setSkip] = useState(false);
  const [, tick] = useState(0);
  const rooms = recentRooms();
  const sess = savedRoom();
  const nm = name.trim();
  const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  return (
    <main className="setup online">
      <button type="button" className="back" onClick={onExit}>← Voltar</button>
      <h2>Jogar online</h2>
      <p className="lead">Crie uma sala e mande o código (ou o link) para os amigos. Cada um joga no seu aparelho, todos veem a mesa e cada um só vê a própria mão. Bots podem completar os assentos.</p>
      <ConnBadge conn={o.conn} />
      {o.gone && <p className="warn" role="alert">{o.gone}</p>}
      {o.error && <p className="warn" role="alert">{o.error.msg}</p>}

      {sess && !skip && !o.gone ? (
        <section className="sec">
          <p>Voltando para a sala <b className="mono">{sess.code}</b>…</p>
          <button type="button" className="btn btn-ghost sm" onClick={() => { o.leave(); setSkip(true); }}>Cancelar</button>
        </section>
      ) : (
        <>
          {rooms.length > 0 && (
            <section className="sec resume">
              <label className="lab">Voltar para uma sala <small>seu lugar ficou guardado neste navegador</small></label>
              {rooms.map((r) => (
                <div key={r.code} className="resume-row">
                  <b className="mono">{r.code}</b>
                  <button type="button" className="btn btn-primary sm" disabled={o.conn !== 'open'} onClick={() => o.resume(r.code)}>Voltar para a sala</button>
                  <button type="button" className="x" aria-label={`Esquecer a sala ${r.code}`} onClick={() => { forgetRoom(r.code); tick((n) => n + 1); }}>×</button>
                </div>
              ))}
            </section>
          )}
          <section className="sec">
            <label className="lab" htmlFor="on-name">Seu nome</label>
            <input id="on-name" className="inp" value={name} maxLength={20} placeholder="Como os amigos vão te ver" onChange={(e) => setName(e.target.value)} />
          </section>
          <section className="sec two">
            <div>
              <label className="lab">Nova sala</label>
              <button type="button" className="btn btn-primary" disabled={!nm || o.conn !== 'open'} onClick={() => o.create(nm)}>
                <b>Criar sala</b><span>você é o anfitrião</span>
              </button>
            </div>
            <div>
              <label className="lab" htmlFor="on-code">Tenho um código</label>
              <div className="join-row">
                <input id="on-code" className="inp code-inp" value={cleanCode} maxLength={6} placeholder="ABC123" autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nm && cleanCode.length === 6 && o.conn === 'open') o.join(cleanCode, nm); }} />
                <button type="button" className="btn btn-primary alt" disabled={!nm || cleanCode.length !== 6 || o.conn !== 'open'} onClick={() => o.join(cleanCode, nm)}>Entrar</button>
              </div>
            </div>
          </section>
          {!nm && <p className="hint">Escreva seu nome para criar ou entrar numa sala.</p>}
        </>
      )}
    </main>
  );
}

function Lobby({ o }) {
  const L = o.lobby;
  const [done, setDone] = useState('');
  const [rules, setRules] = useState(false);
  const isHost = L.you === L.host;
  const flash = (k) => { setDone(k); setTimeout(() => setDone(''), 1800); };
  const share = async () => {
    const url = inviteLink(L.code);
    if (navigator.share) { try { await navigator.share({ title: 'MANDATO', text: `Entre na minha sala do MANDATO: ${L.code}`, url }); return; } catch { /* cancelou: copia */ } }
    flash(await copy(url) ? 'link' : '');
  };
  return (
    <main className="setup online lobby">
      <button type="button" className="back" onClick={() => o.leave()}>← Sair da sala</button>
      <h2>Sala de espera</h2>
      <ConnBadge conn={o.conn} />
      {o.error && <p className="warn" role="alert">{o.error.msg}</p>}

      <div className="lobby-grid">
      <div className="lobby-main">
      <section className="sec invite">
        <label className="lab">Código de convite</label>
        <div className="code-box" aria-live="polite">
          {L.code.split('').map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div className="invite-actions">
          <button type="button" className="btn sm" onClick={async () => flash(await copy(L.code) ? 'code' : '')}>{done === 'code' ? 'Copiado ✓' : 'Copiar código'}</button>
          <button type="button" className="btn btn-primary sm" onClick={share}>{done === 'link' ? 'Link copiado ✓' : 'Copiar link de convite'}</button>
        </div>
        <small className="hint">Quem tem o link entra direto na sala. Código: o amigo abre <b>{location.host}/mandato</b> → Jogar online → Tenho um código.</small>
      </section>

      <section className="sec">
        <label className="lab">Prefeitos <small>{L.seats.length}/6 · de 2 a 6 para começar · a ordem dos assentos é sorteada ao iniciar</small></label>
        <ul className="seats lobby-seats">
          {L.seats.map((s, i) => (
            <li key={i} className={s.online ? '' : 'off'}>
              <i className="disc" style={{ background: PLAYER_COLORS[i] }} />
              <span className="ln">{s.name}</span>
              <span className="tags">
                {s.host && <small className="botk">anfitrião</small>}
                {i === L.you && <small className="botk you">você</small>}
                {s.bot && <small className="botk">bot</small>}
                {!s.online && <small className="botk offl">offline</small>}
              </span>
              {isHost && !s.host ? <button type="button" className="x" onClick={() => o.act('remove', { seat: i })} aria-label={`Remover ${s.name}`}>×</button> : <span />}
            </li>
          ))}
        </ul>
        {isHost && L.seats.length < 6 && <button type="button" className="btn btn-ghost sm" onClick={() => o.act('addBot')}>+ Adicionar bot</button>}
      </section>

      <section className="sec two">
        <div>
          <label className="lab">Duração</label>
          <div className="seg wide">
            {[[8, 'Curto · ⭐8'], [10, 'Padrão · ⭐10'], [12, 'Épico · ⭐12']].map(([n, l]) => (
              <button type="button" key={n} className={L.opts.target === n ? 'on' : ''} disabled={!isHost} onClick={() => o.act('opts', { target: n })}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="lab">Variante</label>
          <label className="chk"><input type="checkbox" checked={L.opts.noIntrigues} disabled={!isHost} onChange={(e) => o.act('opts', { noIntrigues: e.target.checked })} /> Sem Intrigas</label>
        </div>
      </section>


      {isHost ? (
        <>
          <button type="button" className="btn btn-primary go" disabled={L.seats.length < 2} onClick={() => o.act('start')}>Iniciar partida</button>
          {L.seats.length < 2 && <p className="hint">Espere um amigo entrar ou adicione um bot.</p>}
        </>
      ) : <p className="lead">Aguardando o anfitrião iniciar a partida…</p>}
      </div>
      <aside className="lobby-side">
      <section className="sec">
        <label className="lab">Conversa <small>combine com a turma antes de começar</small></label>
        <Chat list={o.chat} you={L.you} onSend={o.sendChat} compact />
      </section>

      <p className="hint"><button type="button" className="m-link" onClick={() => setRules(true)}>Como jogar (regras resumidas)</button></p>
      {rules && <Rules onClose={() => setRules(false)} />}
      </aside>
      </div>
    </main>
  );
}

export default function Online({ initialCode, onExit }) {
  const o = useOnline();
  if (o.state) {
    const st = o.state;
    const online = {
      viewer: st.you, send: o.send, botNote: o.botNote, presence: st.presence, host: st.host, code: st.code,
      error: o.error, connected: o.conn === 'open', botify: (seat) => o.act('botify', { seat }),
      chat: o.chat, sendChat: o.sendChat, rematch: () => o.act('rematch'),
    };
    return <Game game={st.view} online={online} onExit={() => { o.leave(); onExit(); }} />;
  }
  if (o.lobby) return <Lobby o={o} />;
  return <Entry o={o} onExit={onExit} initialCode={initialCode} />;
}
