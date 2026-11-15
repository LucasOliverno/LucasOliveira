// Auditoria de viabilidade: procura objetivos impossíveis ou cartas sem lugar para construir.
//   node src/mandato/test/audit.mjs [partidas]
import * as E from '../engine.js';
import * as B from '../bot.js';
import { CARDS, TERRAINS, TERRAIN_IDS, GOALS, EXPLORE } from '../data.js';

const N = Number(process.argv[2] || 300);
const problems = [];

// 1) cartas com casa obrigatória: em quais terrenos não existe essa casa?
const kindsOf = (tid) => {
  const s = E.newGame({ players: [{ name: 'x' }], solo: true });
  s.draft.pool = [...TERRAIN_IDS];
  E.exec(s, { t: 'pick', terrain: tid });
  return new Set(s.players[0].tiles.map((t) => t.k));
};
const KINDS = Object.fromEntries(TERRAIN_IDS.map((t) => [t, kindsOf(t)]));
for (const c of Object.values(CARDS)) {
  if (!c.onlyOn) continue;
  const where = TERRAIN_IDS.filter((t) => c.onlyOn.some((k) => KINDS[t].has(k)));
  if (c.regional) {
    const own = TERRAIN_IDS.find((t) => c.id.includes(`-${{ litoral: 'LIT', montanha: 'MON', planicie: 'PLA', deserto: 'DES', floresta: 'FLO', ilha: 'ILH' }[t]}-`));
    if (!where.includes(own)) problems.push(`Regional ${c.id} ${c.name}: exige casa ${c.onlyOn.join('/')} que o próprio terreno (${own}) não tem.`);
  } else if (where.length < TERRAIN_IDS.length) {
    console.log(`info: ${c.id} ${c.name} (casa ${c.onlyOn.join('/')}) só serve em: ${where.join(', ') || 'nenhum terreno'}`);
    if (!where.length) problems.push(`${c.id} ${c.name}: nenhum terreno tem a casa ${c.onlyOn.join('/')}.`);
  }
}

// 2) Exploração: Sítios que dão regionais de outro terreno
for (const [tid, deck] of Object.entries(EXPLORE)) {
  deck.forEach((x) => (x.ops || []).forEach((o) => {
    if (o.op === 'site' && CARDS[o.id] && CARDS[o.id].regional && !E.regionalOf({ terrain: tid }).includes(o.id)) problems.push(`Exploração ${x.id} (${tid}) dá ${o.id}, que é de outro terreno.`);
  }));
}

// 3) simulação: quantas vezes cada Meta e cada Meta Regional é cumprida
const goalHits = {}, goalSeen = {}, regHit = {}, regPlayed = {};
for (let i = 0; i < N; i++) {
  B.BOT_OPTS.draft = 'random';
  const s = E.newGame({ players: Array.from({ length: 4 }, (_, k) => ({ name: 'B' + k, bot: true })), seed: 5000 + i });
  s.logCap = 1e6;
  B.runBots(s, 1e6);
  s.goals.slots.forEach((sl) => { goalSeen[sl.id] = (goalSeen[sl.id] || 0) + 1; if (sl.gold != null) goalHits[sl.id] = (goalHits[sl.id] || 0) + 1; });
  s.players.forEach((p) => { regPlayed[p.terrain] = (regPlayed[p.terrain] || 0) + 1; if (p.regionalDone) regHit[p.terrain] = (regHit[p.terrain] || 0) + 1; });
}
console.log('\nMetas (cumprida por alguém / apareceu):');
GOALS.forEach((g) => {
  const seen = goalSeen[g.id] || 0, hit = goalHits[g.id] || 0;
  const pct = seen ? Math.round((hit / seen) * 100) : 0;
  console.log(`  ${g.id} ${g.name.padEnd(22)} ${String(hit).padStart(4)}/${String(seen).padEnd(4)} ${pct}%`);
  if (seen >= 20 && hit === 0) problems.push(`Meta ${g.id} ${g.name}: nunca cumprida em ${seen} partidas.`);
});
console.log('\nMetas Regionais (cumprida / jogadores com o terreno):');
TERRAIN_IDS.forEach((t) => {
  const pl = regPlayed[t] || 0, h = regHit[t] || 0;
  console.log(`  ${TERRAINS[t].name.padEnd(9)} ${TERRAINS[t].regionalGoal.name.padEnd(22)} ${h}/${pl} ${pl ? Math.round((h / pl) * 100) : 0}%`);
  if (pl >= 20 && h === 0) problems.push(`Meta Regional de ${TERRAINS[t].name} (${TERRAINS[t].regionalGoal.name}): nunca cumprida em ${pl} jogadores.`);
});
console.log(problems.length ? `\nPROBLEMAS:\n- ${problems.join('\n- ')}` : '\nnenhum problema estrutural encontrado');
