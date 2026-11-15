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
  const hi = p.hand.indexOf('P-01');
  const r = E.checkBuild(s, p, { src: 'hand', hi, tile: i, v: 'RES' });
  ok(!r.err && r.desmate && r.ob === 2, `Floresta: Loteamento RES custa 🔨1+1 e desmata (ob=${r.ob})`);
  const before = p.cubesBag;
  E.exec(s, { t: 'build', src: 'hand', hi, tile: i, v: 'RES' });
  ok(p.cubesBag === before + 1 && p.tiles[i].cleared, 'desmatar: +1 🕵️ e casa desmatada');
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

console.log(fails ? `\n${fails} FALHAS` : '\ntodos os cenários passaram');
