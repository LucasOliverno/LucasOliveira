import { useCallback, useEffect, useState } from 'react';
import { newGame } from './engine.js';
import { runBots } from './bot.js';
import { Home, Setup, Rules } from './ui/screens.jsx';
import Game from './ui/Game.jsx';

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
  const [screen, setScreen] = useState('home');
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
          onRules={() => setRules(true)}
          onContinue={() => { setGameState(saved); setScreen('game'); }}
        />
      )}
      {screen === 'setup' && <Setup mode={mode} onBack={() => setScreen('home')} onStart={start} />}
      {screen === 'game' && game && <Game game={game} setGame={setGame} onExit={exit} />}
      {rules && <Rules onClose={() => setRules(false)} />}
    </div>
  );
}
