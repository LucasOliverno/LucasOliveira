// Simulação em massa com bots. Uso: npm run sim:garimpo -- [partidas] [jogadores] [dlc1,dlc2]
import * as E from '../engine.js';
import * as B from '../bot.js';
import { CARDS } from '../data.js';

const N = Number(process.argv[2] || 300);
const np = Number(process.argv[3] || 4);
const dlc = (process.argv[4] || '').split(',').filter(Boolean);
const GREEDS = (process.env.GREEDS || '1,1.3,1.6,2').split(',').map(Number);
const t0 = Date.now();
let over = 0, errs = 0;
const turns = [], scores = [], winScores = [];
const seatWins = {}, status = { out: 0, rescued: 0, deep: 0 };
let ninhoTaken = 0, ninhoWins = 0, furies = 0, bites = 0, gazes = 0, relicsTaken = 0, buys = 0, buyTurns = 0, pturns = 0, tiles = 0, deckSize = 0;
const firstExit = [];
const cardWin = {}, cardAll = {};
const build = {}; let combos = 0;
const buildOf = (p) => { const f = {}; let n = 0; for (const id of E.allCards(p)) { const fam = CARDS[id]?.fam; if (fam) { f[fam] = (f[fam] || 0) + 1; n++; } } if (n < 3) return 'sem família'; const top = Object.entries(f).sort((a, b) => b[1] - a[1])[0]; return top[1] / n >= 0.5 ? top[0] : 'mista'; };
for (let i = 0; i < N; i++) {
  try {
    const s = E.newGame({ players: Array.from({ length: np }, (_, k) => ({ name: 'Bot' + (k + 1), bot: true, greed: GREEDS[(k + i) % GREEDS.length] })), seed: i + 1, dlc });
    s.logCap = 1e5;
    while (!s.over && pturns < 1e9) { const p = E.currentPlayer(s); const L = s.log.length; if (s.pending.length) { E.exec(s, E.defaultChoice(s)); continue; } B.botTurn(s); const b = s.log.slice(L).filter((l) => l.pid === p.id && l.kind === 'buy' && !l.msg.includes('Mascate')).length; buys += b; if (b) buyTurns++; pturns++; }
    if (!s.over) { errs++; if (errs < 4) console.log('NOT OVER seed', i + 1, 'turn', s.turnNo, s.players.map((p) => `${p.node}/${p.status}/${p.folego}`)); continue; }
    over++;
    turns.push(s.turnNo); tiles += s.stats.tiles; combos += s.log.filter((l) => l.kind === 'combo').length;
    const fe = s.log.find((l) => l.kind === 'exit' || l.kind === 'dead'); if (fe) firstExit.push(fe.n);
    furies += s.stats.furies; bites += s.stats.bites; gazes += s.stats.gazes;
    for (const p of s.players) {
      const sc = E.scoreOf(s, p).total;
      scores.push(sc);
      relicsTaken += p.relics.length; deckSize += E.allCards(p).length;
      const bd = buildOf(p); build[bd] ||= { n: 0, w: 0 }; build[bd].n++; if (s.winners.includes(p.id)) build[bd].w++;
      if (p.status === 'out') status.out++; else if (p.deadZone === 'fundo' || !p.relics.length) status.deep++; else status.rescued++;
      const ids = new Set(E.allCards(p));
      for (const id of ids) { cardAll[id] = (cardAll[id] || 0) + 1; if (s.winners.includes(p.id)) cardWin[id] = (cardWin[id] || 0) + 1; }
      if (p.relics.includes('R30')) { ninhoTaken++; if (s.winners.includes(p.id)) ninhoWins++; }
    }
    for (const w of s.winners) { seatWins[w] = (seatWins[w] || 0) + 1; winScores.push(E.scoreOf(s, s.players[w]).total); }
    if (i === 0 && process.env.LOG) console.log(s.log.map((l) => `[${l.n}] ${l.msg}`).join('\n'));
  } catch (e) { errs++; console.log('ERR seed', i + 1, e.stack.split('\n').slice(0, 6).join('\n')); if (errs > 3) break; }
}
const avg = (a) => (a.reduce((x, y) => x + y, 0) / (a.length || 1)).toFixed(1);
const pc = (x, t) => ((x / (t || 1)) * 100).toFixed(0) + '%';
const tp = over * np;
console.log(`games=${over} errs=${errs} players=${np} dlc=[${dlc}] time=${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`rounds avg ${avg(turns)} (min ${Math.min(...turns)}, max ${Math.max(...turns)}) · first exit/burial round ${avg(firstExit)} · tiles/game ${(tiles / (over || 1)).toFixed(1)}`);
console.log(`deckbuilding: buys/player ${(buys / tp).toFixed(1)} · turns with a buy ${pc(buyTurns, pturns)} · turns/player ${(pturns / tp).toFixed(1)} · final deck ${(deckSize / tp).toFixed(1)}`);
console.log(`exit alive ${pc(status.out, tp)} · buried near Boca with relic (rescued) ${pc(status.rescued, tp)} · buried with 0 pts ${pc(status.deep, tp)}`);
console.log(`score avg ${avg(scores)} · winner avg ${avg(winScores)} · relics/player ${(relicsTaken / tp).toFixed(2)}`);
console.log(`win% by seat`, Object.fromEntries(Object.entries(seatWins).map(([k, v]) => [k, pc(v, over)])));
console.log(`ninho taken ${pc(ninhoTaken, over)} of games · ninho taker wins ${pc(ninhoWins, ninhoTaken)}`);
console.log(`furies/game ${(furies / over).toFixed(1)}${dlc.includes('cerbero') ? ` · bites/game ${(bites / over).toFixed(1)}` : ''}${dlc.includes('medusa') ? ` · gazes/game ${(gazes / over).toFixed(1)}` : ''}`);
const top = Object.entries(cardWin).filter(([id]) => !['LAMP', 'BARG', 'PICG', 'TROP'].includes(id))
  .map(([id, w]) => [id, w / (over || 1)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log('most common in winning decks', top.map(([id, f]) => `${CARDS[id].name} ${(f * 100).toFixed(0)}%`).join(' · '));
console.log(`combos/game ${(combos / (over || 1)).toFixed(1)} · builds (share of players · win rate vs fair ${(100 / np).toFixed(0)}%):`, Object.entries(build).map(([k, v]) => `${k} ${pc(v.n, tp)} · vence ${pc(v.w, v.n)}`).join(' | '));
if (errs) process.exitCode = 1;
