import { useEffect, useRef, useState } from 'react';
import { PLAYER_COLORS } from '../data.js';

// Conversa da sala (online). list: [{ seat, name, text, ts }]; seat null = aviso da mesa.
export function Chat({ list, you, colors, onSend, compact }) {
  const [text, setText] = useState('');
  const box = useRef(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [list.length]);
  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };
  const color = (seat) => (seat == null ? 'var(--ink)' : (colors && colors[seat]) || PLAYER_COLORS[seat] || 'var(--ink)');
  return (
    <div className={`chat${compact ? ' chat-compact' : ''}`}>
      <div className="chat-list" ref={box} aria-live="polite">
        {list.length === 0 && <p className="empty">Ninguém falou nada ainda. Combine a estratégia (ou provoque os rivais).</p>}
        {list.map((m, i) => (
          <p key={`${m.ts}-${i}`} className={`cm${m.seat == null ? ' sys' : ''}${m.seat === you ? ' me' : ''}`}>
            {m.seat != null && <b style={{ color: color(m.seat) }}>{m.name}</b>}
            <span>{m.text}</span>
          </p>
        ))}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input className="inp" value={text} maxLength={240} placeholder="Mensagem para a mesa…" onChange={(e) => setText(e.target.value)} aria-label="Mensagem" />
        <button type="submit" className="btn sm" disabled={!text.trim()}>Enviar</button>
      </form>
    </div>
  );
}
