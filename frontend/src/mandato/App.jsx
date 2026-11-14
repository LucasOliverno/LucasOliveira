import { useCallback, useEffect, useState } from 'react';
import { newGame } from './engine.js';
import { runBots } from './bot.js';
import { Home, Setup, Rules } from './ui/screens.jsx';
import Game from './ui/Game.jsx';
import Online from './ui/online.jsx';
import { savedRoom } from './online/useOnline.js';

const KEY = 'mandato:save:v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw && JSON.parse(raw);
    return s && s.v === 2 && Array.isArray(s.players) && !s.over ? s : null;
  } catch {
    return null;
  }
}
function save(s) {
  try {
    if (!s || s.over) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* sem armazenamento: segue sem salvar */ }
}

export default function App() {
  const [invite] = useState(() => { try { return (new URLSearchParams(location.search).get('sala') || '').toUpperCase().slice(0, 6); } catch { return ''; } });
  const [screen, setScreen] = useState(invite || savedRoom() ? 'online' : 'home');
  const [mode, setMode] = useState('solo');
  const [game, setGameState] = useState(null);
  const [saved, setSaved] = useState(() => load());
  const [rules, setRules] = useState(false);

  useEffect(() => { document.body.classList.add('mandato'); return () => document.body.classList.remove('mandato'); }, []);

  const setGame = useCallback((s) => { setGameState(s); save(s); }, []);

  const start = (cfg) => {
    const s = newGame(cfg);
    runBots(s);
    setGame(s);
    setScreen('game');
  };

  const exit = () => {
    if (game && game.over) save(null);
    setSaved(game && !game.over ? game : null);
    setGameState(null);
    setScreen('home');
  };

  return (
    <div className="mnd">
      {screen === 'home' && (
        <Home
          saved={saved}
          onSolo={() => { setMode('solo'); setScreen('setup'); }}
          onLocal={() => { setMode('local'); setScreen('setup'); }}
          onOnline={() => setScreen('online')}
          onRules={() => setRules(true)}
          onContinue={() => { setGameState(saved); setScreen('game'); }}
        />
      )}
      {screen === 'setup' && <Setup mode={mode} onBack={() => setScreen('home')} onStart={start} />}
      {screen === 'game' && game && <Game game={game} setGame={setGame} onExit={exit} />}
      {screen === 'online' && <Online initialCode={invite} onExit={() => { try { history.replaceState(null, '', location.pathname); } catch { /* sem history */ } setScreen('home'); }} />}
      {rules && <Rules onClose={() => setRules(false)} />}
    </div>
  );
}
