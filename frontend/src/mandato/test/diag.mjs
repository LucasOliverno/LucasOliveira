// Diagnóstico de ritmo: médias por rodada (mérito, edifícios, renda, população, cartas no deck) com bots.
//   node src/mandato/test/diag.mjs [partidas] [jogadores]
import * as E from '../engine.js';
import * as B from '../bot.js';

const N = Number(process.argv[2] || 60);
const np = Number(process.argv[3] || 4);
const per = {};
const add = (r, k, v) => { per[r] = per[r] || {}; per[r][k] = (per[r][k] || 0) + v; };
let first5 = [];
for (let i = 0; i < N; i++) {
  const s = E.newGame({ players: Array.from({ length: np }, (_, k) => ({ name: 'B' + k, bot: true })), seed: 1000 + i });
  s.logCap = 100000;
  let round = -1;
  let f5 = null;
  for (let g = 0; g < 20000 && !s.over; g++) {
    if (s.round !== round && s.phase === 'play') {
      round = s.round;
      for (const p of s.players) {
        const c = E.calc(s, p);
        add(round, 'merit', p.merit / np / N);
        add(round, 'build', p.tiles.filter((t) => t.b && t.b.id !== 'PREF' && t.b.id !== 'HOME').length / np / N);
        add(round, 'incV', c.inc.v / np / N);
        add(round, 'incO', c.inc.o / np / N);
        add(round, 'incA', c.inc.a / np / N);
        add(round, 'pop', c.pop / np / N);
        add(round, 'deck', (p.deck.length + p.hand.length + p.discard.length) / np / N);
        add(round, 'appr', p.approval / np / N);
        add(round, 'wond', p.wondersScored / np / N);
        if (f5 == null && p.merit >= 5) f5 = round;
      }
    }
    const before = JSON.stringify([s.round, s.turnIdx, s.pending.length, s.phase]);
    B.runBots(s, 1);
    if (JSON.stringify([s.round, s.turnIdx, s.pending.length, s.phase]) === before && !s.over) { /* turno inteiro do bot */ }
  }
  if (f5 != null) first5.push(f5);
}
const keys = ['merit', 'build', 'incV', 'incO', 'incA', 'pop', 'deck', 'appr', 'wond'];
console.log('rd  ' + keys.map((k) => k.padStart(6)).join(''));
for (const r of Object.keys(per).sort((a, b) => a - b)) console.log(String(r).padStart(2) + '  ' + keys.map((k) => (per[r][k] || 0).toFixed(2).padStart(6)).join(''));
console.log('1º ⭐5 (rodada média):', first5.length ? (first5.reduce((a, b) => a + b, 0) / first5.length).toFixed(1) : '-', `(${first5.length}/${N} partidas)`);
