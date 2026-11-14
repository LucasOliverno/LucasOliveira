// Simulação em massa com bots (08 §8). Uso: npm run sim:mandato -- [partidas] [jogadores] [solo] [nivel]
import * as E from '../engine.js';
import * as B from '../bot.js';

const N = Number(process.argv[2] || 100);
const np = Number(process.argv[3] || 4);
const solo = process.argv[4] === 'solo';
const level = process.argv[5] || 'normal';
if (process.env.DRAFT) B.BOT_OPTS.draft = process.env.DRAFT;
const rounds = {}, wins = {}, wt = {}, tt = {}, src = {};
const wm = [];
let fisc = 0, inv = 0, cri = 0, errs = 0, merits = [], t0 = Date.now(), over = 0;
for (let i = 0; i < N; i++) {
  try {
    const players = solo ? [{ name: 'Bot', bot: true }] : Array.from({ length: np }, (_, k) => ({ name: 'Bot' + (k + 1), bot: true }));
    let s = E.newGame({ players, solo, level, seed: i + 1 });
    s.logCap = 100000;
    B.runBots(s, 100000);
    if (!s.over) { errs++; console.log('NOT OVER seed', i + 1, 'round', s.round, 'actor', E.actor(s), s.pending[0]); continue; }
    over++;
    rounds[s.round] = (rounds[s.round] || 0) + 1;
    wm.push(Math.max(...s.players.map((p) => p.merit)));
    s.winners.forEach((w) => { wins[w] = (wins[w] || 0) + 1; const t = s.players[w].terrain; wt[t] = (wt[t] || 0) + 1; });
    s.players.forEach((p) => { tt[p.terrain] = (tt[p.terrain] || 0) + 1; merits.push(p.merit); });
    for (const [k, v] of Object.entries(s.stats.src)) src[k] = (src[k] || 0) + v;
    fisc += s.stats.fisc; inv += s.stats.invest; cri += s.stats.crises;
    if (i === 0) console.log(s.log.slice(-25).map((l) => l.msg).join('\n'));
  } catch (e) { errs++; console.log('ERR seed', i + 1, e.stack.split('\n').slice(0, 6).join('\n')); if (errs > 3) break; }
}
const tot = Object.values(src).reduce((a, b) => a + b, 0);
console.log(`games=${over} errs=${errs} time=${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('rounds', rounds);
console.log('win% by seat', Object.fromEntries(Object.entries(wins).map(([k, v]) => [k, (v / over * 100).toFixed(1)])));
console.log('win by seat', wins);
console.log('winner merit avg', (wm.reduce((a, b) => a + b, 0) / wm.length).toFixed(2), 'p90', [...wm].sort((a, b) => a - b)[Math.floor(wm.length * 0.9)]);
console.log('avg merit', (merits.reduce((a, b) => a + b, 0) / merits.length).toFixed(2));
console.log('terrain win rate', Object.fromEntries(Object.keys(tt).map((k) => [k, ((wt[k] || 0) / tt[k] * (solo ? 1 : np)).toFixed(2)])));
console.log('merit src %', Object.fromEntries(Object.entries(src).map(([k, v]) => [k, (v / tot * 100).toFixed(0)])));
console.log('fisc/game', (fisc / over).toFixed(1), 'invest', (inv / over).toFixed(2), 'crises', (cri / over).toFixed(2));
