import { useCallback, useEffect, useRef, useState } from 'react';

// A sessão fica por aba (sessionStorage): sobrevive a recarregar a página, e duas abas do mesmo navegador podem ser jogadores diferentes.
const SESSION = 'mandato:online:session';
const NAME = 'mandato:online:name';

export const loadName = () => { try { return localStorage.getItem(NAME) || ''; } catch { return ''; } };
export const saveName = (n) => { try { localStorage.setItem(NAME, n); } catch { /* sem armazenamento */ } };
const loadSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION) || 'null'); } catch { return null; } };
const saveSession = (s) => { try { if (s) sessionStorage.setItem(SESSION, JSON.stringify(s)); else sessionStorage.removeItem(SESSION); } catch { /* sem armazenamento */ } };

export const savedRoom = () => loadSession();

// Lugares guardados no navegador (por código de sala): quem fechar a aba pode voltar à mesma cadeira com o token.
const ROOMS = 'mandato:online:rooms';
const WEEK = 7 * 24 * 3600e3;
const readRooms = () => { try { return JSON.parse(localStorage.getItem(ROOMS) || '{}') || {}; } catch { return {}; } };
const writeRooms = (m) => { try { localStorage.setItem(ROOMS, JSON.stringify(m)); } catch { /* sem armazenamento */ } };
const rememberRoom = (code, token, seat) => { const m = readRooms(); m[code] = { token, seat, t: Date.now() }; writeRooms(m); };
export const forgetRoom = (code) => { if (!code) return; const m = readRooms(); if (m[code]) { delete m[code]; writeRooms(m); } };
export const recentRooms = () => Object.entries(readRooms())
  .filter(([, v]) => v && v.token && Date.now() - v.t < WEEK)
  .map(([code, v]) => ({ code, token: v.token, seat: v.seat, t: v.t }))
  .sort((a, b) => b.t - a.t);

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/mandato/ws`;
}

// Conexão com o servidor do jogo: sala, lobby, estado da partida e reconexão automática (mesmo assento, via token).
export function useOnline() {
  const [conn, setConn] = useState('connecting'); // connecting | open | down
  const [lobby, setLobby] = useState(null);
  const [state, setState] = useState(null); // { view, you, presence, host, code }
  const [botNote, setBotNote] = useState(null);
  const [error, setError] = useState(null);
  const [gone, setGone] = useState(null);
  const ws = useRef(null);
  const queue = useRef([]);
  const alive = useRef(true);
  const tries = useRef(0);
  const timers = useRef({});
  const openRef = useRef(null);
  const tryCode = useRef(null);

  const raw = useCallback((m) => {
    const s = ws.current;
    if (s && s.readyState === 1) s.send(JSON.stringify(m));
    else queue.current.push(m);
  }, []);

  const fail = useCallback((msg) => {
    setError({ msg, id: Date.now() });
    clearTimeout(timers.current.err);
    timers.current.err = setTimeout(() => setError(null), 4200);
  }, []);

  const open = useCallback(() => {
    if (!alive.current) return;
    const s = new WebSocket(wsUrl());
    ws.current = s;
    s.onopen = () => {
      tries.current = 0;
      setConn('open');
      const sess = loadSession();
      // volta ao mesmo assento depois de uma queda ou de recarregar a página
      if (sess && !queue.current.some((m) => m.t === 'create' || m.t === 'join' || m.t === 'rejoin')) s.send(JSON.stringify({ t: 'rejoin', code: sess.code, token: sess.token }));
      queue.current.splice(0).forEach((m) => s.send(JSON.stringify(m)));
    };
    s.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === 'joined') { saveSession({ code: m.code, token: m.token, seat: m.seat }); rememberRoom(m.code, m.token, m.seat); }
      else if (m.t === 'lobby') { setLobby(m); setState(null); setGone(null); }
      else if (m.t === 'state') {
        setState(m); setLobby(null); setGone(null);
        if (m.botNote) {
          setBotNote(m.botNote);
          clearTimeout(timers.current.note);
          timers.current.note = setTimeout(() => setBotNote(null), 4200);
        }
      } else if (m.t === 'error') fail(m.msg);
      else if (m.t === 'gone') { forgetRoom(tryCode.current); forgetRoom((loadSession() || {}).code); saveSession(null); setLobby(null); setState(null); setGone(m.msg); }
    };
    s.onclose = () => {
      if (ws.current === s) ws.current = null;
      if (!alive.current) return;
      setConn('down');
      tries.current += 1;
      timers.current.retry = setTimeout(() => openRef.current && openRef.current(), Math.min(1000 * tries.current, 8000));
    };
    s.onerror = () => { try { s.close(); } catch { /* já fechado */ } };
  }, [fail]);

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    openRef.current = open;
    open();
    return () => {
      alive.current = false;
      Object.values(t).forEach(clearTimeout);
      if (ws.current) { ws.current.onclose = null; ws.current.close(); }
    };
  }, [open]);

  const create = useCallback((name) => { saveName(name); saveSession(null); raw({ t: 'create', name }); }, [raw]);
  const join = useCallback((code, name) => { saveName(name); saveSession(null); raw({ t: 'join', code, name }); }, [raw]);
  const leave = useCallback(() => {
    raw({ t: 'leave' });
    forgetRoom((loadSession() || {}).code);
    saveSession(null);
    setLobby(null);
    setState(null);
    setGone(null);
  }, [raw]);
  // volta à cadeira guardada neste navegador (depois de fechar a aba, trocar de aparelho do mesmo navegador etc.)
  const resume = useCallback((code) => {
    const r = recentRooms().find((x) => x.code === code);
    if (!r) return;
    tryCode.current = code;
    saveSession({ code, token: r.token, seat: r.seat });
    raw({ t: 'rejoin', code, token: r.token });
  }, [raw]);
  const act = useCallback((action, extra = {}) => raw({ t: 'lobby', action, ...extra }), [raw]);
  const send = useCallback((cmd) => raw({ t: 'cmd', cmd }), [raw]);

  return { conn, lobby, state, botNote, error, gone, create, join, leave, resume, act, send, clearGone: () => setGone(null) };
}
