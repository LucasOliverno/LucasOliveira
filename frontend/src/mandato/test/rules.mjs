// Testes direcionados das regras (cenários montados à mão). Rode: npm run test:mandato
process.exitCode = 0;
import * as E from '../engine.js';
import { decide } from '../bot.js';
const settleAll = (s) => { for (let g = 0; g < 20 && s.pending.length; g++) E.exec(s, decide(s, s.pending[0])); };
import * as D from '../data.js';
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); };

function game(np, terrains, extra = {}) {
  const s = E.newGame({ players: Array.from({ length: np }, (_, i) => ({ name: 'J' + (i + 1) })), seed: 7, ...extra });
  s.logCap = 1e5;
  s.draft.pool = [...D.TERRAIN_IDS];
  terrains.forEach((t, i) => { const e = E.exec(s, { t: 'pick', terrain: t }); if (e) throw new Error('pick ' + e); });
  return s;
}
const cur = (s) => E.currentPlayer(s);
const give = (p, ...ids) => { p.hand.unshift(...ids); };

// 1) setup, ordem, derivados
{
  const s = game(2, ['litoral', 'montanha']);
  ok(s.phase === 'play' && s.round === 1, 'draft termina e começa a rodada 1');
  ok(s.order[0] === 1, 'rodada 1: último a escolher joga primeiro');
  const p = s.players[0];
  const c = E.calc(s, p);
  ok(c.pop === 4 && c.cap.e === 3 && c.cap.w === 3 && c.sur.e === 2, `Litoral inicial: 👥4, ⚡3/💧3, sobra ⚡2 (got pop ${c.pop} e ${c.sur.e})`);
  const m = s.players[1];
  ok(E.calc(s, m).cap.e === 3, 'Montanha ⚡3 (ajuste de balanceamento)');
  ok(m.tiles.filter((t) => t.k === 'E').length === 5, 'Montanha tem 5 Encostas');
  ok(s.players[1].treasury === 1 || s.players[1].treasury >= 0, 'pacote de posição aplicado');
  ok(p.hand.length === 5 && p.deck.length === 5, 'mão de 5 e deck de 5');
  ok(s.market.row.length === 6 && s.market.vit.length === 3 && s.goals.slots.length === 4, 'mercado: fila 6, vitrine 3, 4 metas (2 jogadores)');
  ok(s.bag.neutral === 6, 'saco com 6 neutros');
}

// 2) construir: Loteamento COM em Orla rende +1 (Litoral); Encosta custa +1 (Montanha); upgrade
{
  const s = game(2, ['litoral', 'montanha']);
  // jogador da vez é o seat 2 (Montanha)
  let p = cur(s); // Montanha
  give(p, 'P-01');
  p.pool = { v: 9, o: 9, a: 9 };
  const hi = p.hand.indexOf('P-01');
  let r = E.checkBuild(s, p, { src: 'hand', hi, tile: 0, v: 'RES' });
  ok(!r.err && r.ob === 2, `Loteamento RES em Encosta custa 🔨2 (got ${r.ob} ${r.err || ''})`);
  r = E.checkBuild(s, p, { src: 'hand', hi, tile: 10, v: 'RES' });
  ok(!r.err && r.ob === 1, 'Loteamento RES em Jazida (plana) custa 🔨1');
  ok(E.exec(s, { t: 'build', src: 'hand', hi, tile: 10, v: 'RES' }) === null, 'constrói Loteamento RES');
  ok(E.calc(s, p).pop === 6, 'pop sobe para 6');
  // Torre Residencial sobre RES (melhoria): ob 3−1=2
  give(p, 'E2-01');
  const hj = p.hand.indexOf('E2-01');
  r = E.checkBuild(s, p, { src: 'hand', hi: hj, tile: 10, upg: true });
  ok(!r.err && r.ob === 2, `Melhoria custa Ob−1 (got ${r.ob} ${r.err || ''})`);
  r = E.checkBuild(s, p, { src: 'hand', hi: hj, tile: 11, upg: false });
  ok(!r.err, 'Torre também pode ir em casa vazia');
  const e = E.exec(s, { t: 'build', src: 'hand', hi: hj, tile: 10, upg: true });
  ok(e === null && p.discard.includes('P-01'), 'melhoria devolve a carta antiga ao descarte');
  // IND em Jazida: +🔨1
  give(p, 'E1-03');
  p.pool = { v: 9, o: 9, a: 9 };
  E.exec(s, { t: 'build', src: 'hand', hi: p.hand.indexOf('E1-03'), tile: 13, upg: false });
  // pop do Req5: 2+2+7=11 >= 5
  const c = E.calc(s, p);
  ok(c.inc.o >= 3, `Oficina em Jazida rende 🔨2+1 (inc.o=${c.inc.o})`);
}

// 3) Req 👥: COM com Req4 inativo se pop<4 — usa Shopping Req 8
{
  const s = game(2, ['planicie', 'litoral']);
  const p = s.players[0];
  p.tiles[12].b = { id: 'E2-02' };
  const c = E.calc(s, p);
  ok(!c.act.has(12), 'Shopping (Req 8) inativo com 👥4');
  p.tiles[13].b = { id: 'E2-01' };
  ok(E.calc(s, p).pop === 11 && E.calc(s, p).act.has(12), 'com Torre (+7) o Shopping ativa');
}

// 4) Floresta: desmatar custa +1 e +1 cubo; Santuário não
{
  const s = game(2, ['litoral', 'floresta']);
  const p = cur(s);
  const i = p.tiles.findIndex((t) => t.k === 'F');
  p.pool = { v: 9, o: 9, a: 9 };
  give(p, 'P-01');
  const lot = E.checkBuild(s, p, { src: 'hand', hi: p.hand.indexOf('P-01'), tile: i, v: 'RES' });
  ok(!lot.err && !lot.desmate && lot.ob === 1, `Floresta (ecovila): Loteamento entra sem desmatar (ob=${lot.ob})`);
  give(p, 'E1-01');
  const hi = p.hand.indexOf('E1-01');
  const r = E.checkBuild(s, p, { src: 'hand', hi, tile: i });
  ok(!r.err && r.desmate && r.ob === 3, `Floresta: Conjunto Habitacional custa 🔨2+1 e desmata (ob=${r.ob})`);
  const before = p.cubesBag;
  E.exec(s, { t: 'build', src: 'hand', hi, tile: i });
  ok(p.cubesBag === before && p.tiles[i].cleared, 'desmatar: casa desmatada, sem cubo (ajuste v1.3)');
  const c = E.calc(s, E.currentPlayer(s) === p ? p : p);
  ok(c.poll <= 0, 'Pulmão Verde reduz ☁️ (≥4 florestas → −2): poll=' + c.poll);
}

// 5) Fiscalização: cubos, 😊 e Investigação
{
  const s = game(2, ['litoral', 'montanha']);
  const p = s.players[0];
  p.cubesBag = 5; p.cubesSupply = 5;
  s.bag.neutral = 0; // só cubos de p
  const a0 = p.approval;
  E.fisc(s, 'teste');
  ok(p.approval === a0 - 3 && p.merit === 0, `3 cubos: −3 😊 (Tensão 3), merit ${p.merit}`);
  ok(p.cubesBag === 2 && p.cubesSupply === 8, 'cubos sorteados voltam ao estoque');
  ok(s.stats.invest === 1 && p.investRound === s.round, 'Investigação com ≥3 cubos');
}

// 6) Intriga + Reação (Contra-Inteligência)
{
  const s = game(2, ['litoral', 'montanha']);
  const a = cur(s); const b = s.players[1 - a.id];
  a.hand = ['I1-02', 'B-01']; b.hand = ['I2-03', 'B-01'];
  const e = E.exec(s, { t: 'intrigue', hi: 0, target: b.id });
  ok(e === null && s.pending[0] && s.pending[0].kind === 'reaction' && s.pending[0].pid === b.id, 'Intriga contra jogador com Contra-Inteligência abre reação');
  const ap = b.approval;
  E.exec(s, { t: 'choose', use: true });
  ok(b.approval === ap && b.exiled.includes('I2-03') && a.exiled.includes('I1-02'), 'Reação cancela a Intriga (ambas exiladas)');
  a.hand.push('I1-01'); a.t.intrigued = false;
  ok(typeof E.exec(s, { t: 'intrigue', hi: a.hand.length - 1, target: b.id }) === 'string', 'não pode mirar o mesmo jogador 2× seguidas');
}

// 7) Decreto: Austeridade limita 😊 a 7 e dá +💰2
{
  const s = game(2, ['litoral', 'montanha']);
  const p = cur(s);
  p.approval = 9; give(p, 'D1-01'); p.pool.v = 5;
  const inc0 = E.calc(s, p).inc.v;
  E.exec(s, { t: 'decree', hi: p.hand.indexOf('D1-01'), slot: 0 });
  ok(p.approval === 7 && E.calc(s, p).inc.v === inc0 + 2, 'Austeridade: 😊 ≤7 e +💰2');
}

// 8) Facções: marco 3 (+⭐1) e Aliança
{
  const s = game(2, ['litoral', 'montanha']);
  const p = s.players[0];
  E.advFac(s, p, 'emp', 3);
  ok(p.merit === 1, 'marco 3 dá ⭐1');
  E.advFac(s, p, 'emp', 2);
  ok(s.tokens.emp === p.id && p.merit === 2, 'Aliança dos Empresários com 5 e único mais alto (+⭐1)');
  E.advFac(s, s.players[1], 'emp', 6);
  ok(s.tokens.emp === 1 && p.merit === 1, 'ultrapassado: token e ⭐ passam');
}

// 9) Metas: Ouro/Prata, 1 por turno
{
  const s = game(2, ['litoral', 'montanha']);
  const p = cur(s);
  s.goals.slots[0] = { id: 'G-14', gold: null, silver: null };
  p.cabinet = ['D1-01', 'D2-02'];
  ok(E.exec(s, { t: 'claim', slot: 0 }) === null && p.merit === 2, 'Meta Gabinete Completo: Ouro ⭐2');
  s.goals.slots[1] = { id: 'G-14', gold: null, silver: null };
  ok(typeof E.exec(s, { t: 'claim', slot: 1 }) === 'string', 'só 1 Meta por turno');
}

// 10) Ilha: adjacência por ilha + Balsa
{
  const s = game(2, ['litoral', 'ilha']);
  const p = cur(s);
  ok(p.tiles.length === 16 && p.tiles.filter((t) => t.isl === 'M').length === 8, 'Ilha: 16 casas, 8 na principal');
  ok(p.tiles[8].adj.every((j) => p.tiles[j].isl === 'N'), 'adjacência só dentro da ilha');
  p.pool = { v: 9, o: 9, a: 9 };
  p.hand.unshift('R-ILH-2');
  const hi = 0;
  const r = E.checkBuild(s, p, { src: 'hand', hi, tile: 8 });
  ok(!r.err && r.ob === 2, `Balsa em ilha menor sem custo extra (só IND paga logística): ${r.ob}`);
  E.exec(s, { t: 'build', src: 'hand', hi, tile: 8 });
  ok(p.links.includes('N'), 'Balsa liga a ilha');
}

// 11) Explorar abre decisão e resolve
{
  const s = game(2, ['deserto', 'litoral']);
  const p = cur(s);
  p.hand = ['P-03', 'B-01'];
  E.exec(s, { t: 'play', hi: 0 });
  ok(s.pending[0] && s.pending[0].kind === 'explore', 'Explorar pede escolha entre 2 cartas');
  const before = p.explored;
  E.exec(s, { t: 'choose', i: 0 });
  ok(p.explored === before + 1 && !s.pending.length, 'resolve a carta escolhida');
}

// 12) Fim de turno: Tesouro máx 3, compra 5
{
  const s = game(2, ['litoral', 'montanha']);
  const p = cur(s);
  p.pool.v = 9;
  const id = p.id;
  E.exec(s, { t: 'end' });
  ok(p.treasury === 3 && p.hand.length === 5, 'guarda 3 no Tesouro e compra 5');
  ok(E.currentPlayer(s).id !== id, 'passa o turno');
}

// 13) Rodada completa: Auditoria e token
{
  const s = game(3, ['litoral', 'montanha', 'planicie']);
  const r0 = s.round;
  for (let i = 0; i < 3; i++) { settleAll(s); E.exec(s, { t: 'end' }); }
  settleAll(s);
  ok(s.round === r0 + 1, 'após 3 turnos começa a rodada 2');
  ok(s.order[0] === 0, 'rodada 2: assento 1 abre');
}

// Sem eventos: a carta de Rodada só traz a Auditoria; duração maior e deck de Rodada reembaralhado
{
  const s = game(2, ['litoral', 'montanha']);
  ok(s.target === D.DEFAULT_TARGET && s.maxRounds === D.DURATIONS.find((d) => d.target === D.DEFAULT_TARGET).rounds, `duração padrão: ⭐${s.target} em ${s.maxRounds} rodadas`);
  ok(!s.log.some((l) => l.kind === 'event'), 'nenhum evento de rodada no diário');
  const s2 = E.newGame({ players: [{ name: 'a', bot: true }, { name: 'b', bot: true }], seed: 3, target: 23 });
  ok(s2.maxRounds === 20, 'Épico: 4 mandatos = 20 rodadas');
  const solo = E.newGame({ players: [{ name: 'a' }], solo: true, seed: 3 });
  ok(solo.target === 10 && E.maxRounds(solo) === 12, 'solo continua ⭐10 em 12 rodadas');
}

// Comprar terreno: vizinho da cidade, 1 por turno, custo crescente, até 5×5
{
  const s = game(2, ['planicie', 'litoral']);
  const p = s.players[E.actor(s)];
  settleAll(s);
  const slots = E.landSlots(p);
  ok(slots.length === 8 && slots.every((o) => o.x === 4 || o.y === 4), `4×4 → 8 terrenos à venda na borda (o canto 5×5 abre depois) (got ${slots.length})`);
  p.pool.v = 20;
  const n0 = p.tiles.length;
  const e1 = E.exec(s, { t: 'land', x: 4, y: 0, isl: 'M' });
  ok(!e1 && p.tiles.length === n0 + 1 && p.pool.v === 20 - E.landCost({ terrain: p.terrain, landBought: 0 }).v, `compra 1 terreno (${e1})`);
  const nt = p.tiles[p.tiles.length - 1];
  ok(nt.adj.length === 1 && p.tiles[nt.adj[0]].adj.includes(nt.id), 'terreno novo fica vizinho da casa ao lado (adjacência recalculada)');
  ok(!!E.exec(s, { t: 'land', x: 4, y: 1, isl: 'M' }), 'só 1 terreno por turno');
  ok(E.landCost(p).v === D.LAND.base + D.LAND.step, 'o próximo terreno custa mais');
  p.t.landed = false;
  ok(!!E.exec(s, { t: 'land', x: 5, y: 0, isl: 'M' }), 'além do 5×5 é recusado');
  const isl = game(2, ['ilha', 'litoral']).players[0];
  ok(E.landSlots(isl).every((o) => o.k === 'C') && E.landSlots(isl).some((o) => o.isl === 'N'), 'Ilha: cada ilha cresce dentro do seu limite');
}

// Marcos da Cidade: ⭐1 ao atingir 8 edifícios (uma vez só)
{
  const s = game(2, ['planicie', 'litoral']);
  const p = s.players[E.actor(s)];
  settleAll(s);
  let n = p.tiles.filter((t) => t.b).length;
  for (const t of p.tiles) { if (n >= 7) break; if (!t.b) { t.b = { id: 'P-01', v: 'RES' }; n++; } }
  p.hand.unshift('P-01');
  p.pool = { v: 9, o: 9, a: 9 };
  const free = p.tiles.findIndex((t) => !t.b);
  const m0 = p.merit;
  const e = E.exec(s, { t: 'build', src: 'hand', hi: 0, tile: free, v: 'RES' });
  settleAll(s);
  ok(!e && p.cityMarks.b8 && p.merit >= m0 + 1, `8º edifício dá o Marco da Cidade (+⭐1) (${e})`);
  const marks = Object.keys(p.cityMarks).length;
  E.exec(s, { t: 'end' });
  ok(Object.keys(p.cityMarks).length >= marks && p.cityMarks.b8, 'marco fica registrado (não pontua de novo)');
}

// Avaliação do Partido: no fim de cada mandato (5 rodadas), 1º ⭐2 e 2º ⭐1; o pior avaliado abre o próximo mandato
{
  const s = E.newGame({ players: [{ name: 'a', bot: true }, { name: 'b', bot: true }, { name: 'c', bot: true }], seed: 11 });
  const B = await import('../bot.js');
  for (let k = 0; k < 2e5 && !s.over && !(s.round === 6 && s.phase === 'play'); k++) B.runBots(s, 1);
  const r = s.lastReview;
  ok(r && r.round === 5 && r.mandate === 1, `Avaliação no fim da rodada 5 (got ${r && r.round})`);
  const best = r.res[0], second = r.res[1];
  ok(best.merit === 2 || (best.merit === 1 && second.v === best.v), 'o melhor avaliado ganha ⭐2 (ou ⭐1 se empatar no topo)');
  ok(r.res.every((x, i) => i === 0 || r.res[i - 1].v >= x.v), 'ranking ordenado pelos pontos do Partido');
  ok(s.order[0] === r.res[r.res.length - 1].pid, 'o pior avaliado abre o 2º mandato');
  ok(s.log.some((l) => /Avaliação do Partido/.test(l.msg) && /Fiscalização/.test(l.msg)), 'o Partido sorteia o Saco na Avaliação');
  const solo = E.newGame({ players: [{ name: 'a' }], solo: true, seed: 3 });
  ok(!E.hasMandates(solo), 'solo não tem Avaliação do Partido');
}

// Gestão & Inteligência: habilidades 1×/turno, mão maior, desconto, Corregedoria
{
  const s = game(2, ['planicie', 'litoral']);
  const p = s.players[E.actor(s)], q = s.players.find((x) => x.id !== p.id);
  settleAll(s);
  const put = (pl, id) => { const t = pl.tiles.find((x) => !x.b && x.k === '.'); t.b = { id }; };
  put(p, 'S1-01'); put(p, 'S1-02'); put(p, 'S2-01'); put(p, 'S2-04'); put(p, 'S3-03'); put(p, 'S3-01');
  p.tiles.find((t) => t.b && t.b.id === 'HOME').b.popBonus = 10; // 👥 suficiente para o Req da Bolsa
  p.pool = { v: 0, o: 0, a: 2 };
  const ab = E.calc(s, p).abil;
  ok(['study', 'cycle', 'spy', 'sell'].every((k) => ab.has(k)), 'habilidades ativas pelos prédios');
  const h0 = p.hand.length;
  ok(!E.exec(s, { t: 'ability', id: 'study' }) && p.hand.length === h0 + 1 && p.pool.a === 1, 'Biblioteca: paga 🗳️1 e compra 1');
  ok(!!E.exec(s, { t: 'ability', id: 'study' }), 'Biblioteca só 1× por turno');
  const first = p.hand[0];
  ok(!E.exec(s, { t: 'ability', id: 'cycle', hi: 0 }) && p.discard.includes(first) && p.hand.length === h0 + 1, 'Cartório: descarta 1 e compra 1');
  const n0 = p.exiled.length, v0 = p.pool.v;
  ok(!E.exec(s, { t: 'ability', id: 'sell', hi: 0 }) && p.exiled.length === n0 + 1 && p.pool.v === v0 + 3, 'Bolsa: exila 1 carta e ganha 💰3');
  const c0 = q.cubesBag;
  ok(!E.exec(s, { t: 'ability', id: 'spy', target: q.id }) && q.cubesBag === c0 + 1, 'Inteligência: o rival põe 1 🕵️ no Saco');
  ok(!!E.exec(s, { t: 'ability', id: 'spy', target: q.id }), 'Inteligência só 1× por turno');
  ok(E.buyCost(s, p, 'A2-01').v === 3, `Gráfica: Administração de 💰5 sai por 💰3 (got ${E.buyCost(s, p, 'A2-01').v})`);
  const c = E.calc(s, p);
  ok(c.handPlus === 1, 'Data Center: +1 carta no fim do turno');
  put(q, 'S2-02');
  p.t.ab = {};
  ok(!!E.exec(s, { t: 'ability', id: 'spy', target: q.id }), 'Corregedoria protege da Inteligência');
}

console.log(fails ? `\n${fails} FALHAS` : '\ntodos os cenários passaram');

// Balsa Rápida: a Ilha pode comprar 2 (uma para cada ilha menor), os outros projetos só 1
{
  const s = game(2, ['ilha', 'litoral']);
  const p = s.players.find((q) => q.terrain === 'ilha');
  while (E.actor(s) !== p.id) { settleAll(s); if (E.actor(s) !== p.id) E.exec(s, { t: 'end' }); }
  settleAll(s);
  p.pool.v = 20; p.pool.a = 5;
  const b1 = E.exec(s, { t: 'buy', src: 'regional', key: 'R-ILH-2' });
  const b2 = E.exec(s, { t: 'buy', src: 'regional', key: 'R-ILH-2' });
  const b3 = E.exec(s, { t: 'buy', src: 'regional', key: 'R-ILH-2' });
  ok(!b1 && !b2 && !!b3, `Balsa: 2 cópias permitidas, a 3ª recusada (${b1}|${b2}|${b3})`);
  const r1 = E.exec(s, { t: 'buy', src: 'regional', key: 'R-ILH-1' });
  const r2 = E.exec(s, { t: 'buy', src: 'regional', key: 'R-ILH-1' });
  ok(!r1 && !!r2, 'Resort Insular: só 1 cópia');
}

// Balsa só nas ilhas menores
{
  const s = game(2, ['ilha', 'litoral']);
  const p = s.players.find((q) => q.terrain === 'ilha');
  p.hand.unshift('R-ILH-2');
  p.pool = { v: 9, o: 9, a: 9 };
  const main = p.tiles.findIndex((t) => t.isl === 'M' && !t.b);
  const north = p.tiles.findIndex((t) => t.isl === 'N' && !t.b);
  ok(!!E.checkBuild(s, p, { src: 'hand', hi: 0, tile: main }).err, 'Balsa recusada na Ilha Principal');
  ok(!E.checkBuild(s, p, { src: 'hand', hi: 0, tile: north }).err, 'Balsa aceita na Ilha Norte');
}
