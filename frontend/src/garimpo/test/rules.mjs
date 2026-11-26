// Testes direcionados das regras do GARIMPO (cenários montados à mão). Rode: npm run test:garimpo
import * as E from '../engine.js';
import * as B from '../bot.js';
import * as D from '../data.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); };
const game = (np = 2, dlc = [], seed = 7) => {
  const s = E.newGame({ players: Array.from({ length: np }, (_, i) => ({ name: 'J' + (i + 1) })), seed, dlc, map: 'classico' });
  s.logCap = 1e5;
  return s;
};
const cur = E.currentPlayer;
const pool = (p, luz = 0, prosa = 0, pic = 0) => Object.assign(p.t, { luz, prosa, pic });
const X = (s, a) => E.exec(s, a);

// 1) preparação
{
  const s = game(4);
  ok(s.row.length === 6 && s.row.every((id) => !D.CARDS[id].quake && D.CARDS[id].type !== 'hazard'), 'Fila inicial com 6 cartas, sem 🌋 nem Perigos');
  ok(s.bag.stone === 6 && s.bag.p.join() === E.START_CUBES.join(), `Bateia: 6 pedras + ${E.START_CUBES.join('/')} cubos por ordem`);
  ok(s.players.every((p) => p.hand.length === 5 && p.deck.length === 5 && p.node === 'S1' && p.folego === 10), 'mão 5, baralho 5, todos na Boca com 🫧10');
  ok(Object.keys(s.relics).length === 7 && Object.values(s.crystals).reduce((a, b) => a + b, 0) === 8, '7 Relíquias e 8 Cristais');
  ok(s.rubble.length === 2, '2 desabamentos iniciais');
  const t = game(4); X(t, { t: 'end' });
  ok(cur(t).id === 1 && cur(t).t.luz === E.SEAT_BONUS[1], `2º jogador começa com 🔦+${E.SEAT_BONUS[1]} no 1º turno`);
}

// 2) escadas, poço, escuro, desabamento, toca
{
  const s = game();
  const p = cur(s);
  ok(E.moveCost(s, p, 'S1', 'A2').luz === 1 && E.moveCost(s, p, 'A2', 'S1').luz === 2, 'escada: desce 🔦1, sobe 🔦2');
  p.relics = ['R10'];
  ok(E.moveCost(s, p, 'A2', 'S1').luz === 2, 'Relíquia leve (✦10) não pesa');
  p.relics = ['R20a'];
  ok(E.moveCost(s, p, 'A2', 'S1').luz === 3, 'Relíquia pesada (✦20+) custa +1 na escada');
  p.items = ['corda'];
  ok(E.moveCost(s, p, 'A2', 'S1').luz === 2, 'Corda Nova anula o peso');
  p.items = []; p.t.ropeUp = true;
  ok(E.moveCost(s, p, 'A2', 'S1').luz === 1, 'Corda de Sisal: subir custa 🔦1');
  p.t.ropeUp = false; p.relics = [];
  ok(E.moveCost(s, p, 'C5', 'A6').err && E.moveCost(s, p, 'A6', 'C5').est === 2, 'poço só desce e faz 💥2');
  ok(E.moveCost(s, p, 'C1', 'C2').luz === 2, 'túnel escuro custa 🔦2');
  p.t.bright = true;
  ok(E.moveCost(s, p, 'C1', 'C2').luz === 1, 'túnel escuro custa 🔦1 depois de jogar carta com 🔦2+');
  ok(!!E.moveCost(s, p, 'A4', 'B4').err, 'desabamento bloqueia');
  p.node = 'A4'; pool(p, 5, 0, 3);
  ok(X(s, { t: 'clear', edge: D.edgeKey('A4', 'B4') }) === null && p.t.pic === 0 && !s.rubble.includes('A4-B4'), 'limpar desabamento com ⛏3');
  p.node = 'A6'; pool(p, 3, 0, 1);
  X(s, { t: 'move', to: 'A7' });
  ok(p.node === 'A7' && p.t.pic === 0 && p.folego === 10, 'Toca de Bicho: paga ⛏1');
  pool(p, 3, 0, 0);
  X(s, { t: 'move', to: 'A6' });
  ok(p.folego === 9, 'Toca de Bicho sem ⛏: perde 🫧1');
}

// 3) trilho, elevador, respiro, geodo
{
  const s = game();
  const p = cur(s);
  p.node = 'A3'; pool(p, 1);
  ok(X(s, { t: 'ride', to: 'A6' }) === null && p.node === 'A6' && p.area === 2 && p.t.luz === 0, 'trilho: 3 nós por 🔦1 e 💥2');
  p.node = 'S3'; pool(p, 0, 2); p.area = 0;
  ok(X(s, { t: 'move', to: 'B6' }) === null && p.node === 'B6' && p.t.prosa === 0 && p.area === 1, 'elevador: 🤝2 e 💥1');
  p.node = 'A2'; p.folego = 7; pool(p, 3);
  X(s, { t: 'move', to: 'A1' }); X(s, { t: 'move', to: 'A2' }); X(s, { t: 'move', to: 'A1' });
  ok(p.folego === 8, 'Respiro cura 🫧1 uma vez por turno');
  p.node = 'D2'; p.area = 0; pool(p, 3);
  X(s, { t: 'move', to: 'D1' });
  ok(p.crystals === 1 && s.crystals.D1 === 1 && p.area === 2, 'Geodo: pega 💠 e faz 💥2');
  X(s, { t: 'move', to: 'D2' });
  X(s, { t: 'move', to: 'D1' });
  ok(p.crystals === 2, 'D2 também é Geodo');
  ok(s.crystals.D1 === 1, 'mesmo Geodo não dá dois Cristais à mesma pessoa');
}

// 4) Relíquias, Fúria, Adrenalina
{
  const s = game();
  const p = cur(s);
  p.node = 'B7';
  ok(X(s, { t: 'take' }) === null && p.relics[0] === 'R10' && s.fury === 2, 'pegar Relíquia sobe a Fúria');
  p.node = 'C6';
  ok(X(s, { t: 'take' }) !== null, 'sem Mochila carrega só 1');
  p.items = ['mochila'];
  p.node = 'E2';
  ok(X(s, { t: 'take' }) === null && s.fury === 4, 'Ninho sobe a Fúria +2');
  s.bag = { stone: 0, p: [0, 2] };
  const q = s.players[1];
  p.hand = []; X(s, { t: 'end' });
  ok(q.folego === 8 && s.stats.furies === 1, 'pegar Relíquia dispara Fúria no fim do turno; cubos do J2 tiram 🫧2');
  ok(cur(s).id === 1, 'passa a vez');
  X(s, { t: 'end' });
  ok(cur(s).id === 0 && cur(s).t.luz === 1, 'Adrenalina: com Relíquia, 🔦+1 no começo do turno');
  const s2 = game();
  s2.bag = { stone: 0, p: [0, 0] }; s2.fury = 1;
  E.fury(s2);
  ok(s2.furyExtra === 1, 'Bateia vazia: próxima Fúria tira +1');
}

// 5) saída, água, soterrado, pontuação
{
  const s = game(2);
  const p = cur(s); const q = s.players[1];
  p.node = 'A2'; p.relics = ['R15a']; pool(p, 2);
  X(s, { t: 'move', to: 'S1' });
  ok(p.status === 'out' && s.water === D.WATER_START && s.clock === 0, 'sair com Relíquia: Selo, água aparece, relógio = quem saiu');
  ok(cur(s).id === 1, 'turno de quem saiu acaba na hora');
  q.node = 'E1'; q.relics = ['R25']; q.gold = 4;
  const ticks = D.WATER_START - 1;
  for (let i = 0; i < ticks && !s.over; i++) { q.hand = []; q.folego = 10; X(s, { t: "end" }); while (s.pending.length) X(s, E.defaultChoice(s)); }
  ok(s.over && q.status === 'dead' && q.deadLv === 5, `água chega na Galeria 1 depois de ${ticks} voltas: fim de jogo`);
  const sc = E.scoreOf(s, q);
  const cardPts = E.allCards(q).reduce((a, id) => a + (D.CARDS[id].pts || 0), 0);
  ok(sc.relics === 28 && sc.selo === 0 && sc.total === Math.floor((4 + q.crystals * 5 + cardPts) / 2), `soterrado fundo: metade, Relíquias não contam (got ${sc.total})`);
  ok(E.scoreOf(s, p).selo === D.SELO && s.winners[0] === 0, 'quem saiu vence com Selo');
  const s3 = game(2);
  const r = cur(s3); r.node = 'A3'; r.gold = 6; r.status = 'dead'; r.deadLv = 1;
  ok(E.scoreOf(s3, r).total === 6 + 0, 'soterrado na Galeria 1: resgatado, pontua tudo (sem Selo)');
  const s4 = game(2);
  s4.water = 3; const w = s4.players[1]; w.node = 'C2'; X(s4, { t: 'end' });
  ok(w.folego === 10 - D.WATER_DMG, 'nível alagado tira 🫧2 no começo do turno');
}

// 6) compras, Bichos, Mascate, Barracão
{
  const s = game();
  const p = cur(s);
  s.row[0] = 'CARB'; s.row[1] = 'MORC'; s.row[2] = 'TOLO';
  pool(p, 0, 5, 4);
  ok(X(s, { t: 'buy', src: 'row', i: 0 }) === null && p.discard.includes('CARB') && p.t.prosa === 2, 'compra da Fila vai para o descarte');
  ok(X(s, { t: 'buy', src: 'row', i: 0 }) !== null, 'Bicho não se compra');
  ok(X(s, { t: 'fight', src: 'row', i: 0 }) === null && p.gold === 1 && p.t.luz === 1, 'Morcego: +🟡1 e 🔦1');
  ok(X(s, { t: 'buy', src: 'row', i: 0 }) === null && p.gold === 4, 'Ouro-de-Tolo dá 🟡3 ao adquirir');
  ok(X(s, { t: 'fight', src: 'fixed' }) === null && p.gold === 5, 'Rato-de-Mina fixo: ⛏2 → 🟡1');
  pool(p, 0, 3);
  ok(X(s, { t: 'buy', src: 'fixed', id: 'QUER' }) === null && s.fixedQty.QUER === 11, 'compra fixa');
  p.node = 'B3';
  ok(X(s, { t: 'mascate', item: 'capacete' }) === null && p.gold === 0 && E.hasItem(p, 'capacete'), 'Mascate: Capacete por 🟡5');
  p.gold = 9;
  ok(X(s, { t: 'mascate', item: 'corda' }) !== null, 'uma compra no Mascate por turno');
  p.node = 'S2'; p.folego = 5; pool(p, 0, 2);
  ok(X(s, { t: 'rest' }) === null && p.folego === 6, 'Barracão: 🤝2 → 🫧+1');
}

// 7) escolhas pendentes
{
  const s = game();
  const p = cur(s);
  p.hand = ['BENZ', 'TROP'];
  X(s, { t: 'play', hi: 0 });
  ok(s.pending[0]?.k === 'trash', 'Benzedeira abre escolha de destruir');
  ok(X(s, { t: 'move', to: 'A2' }) !== null, 'nada acontece com escolha pendente');
  X(s, { t: 'choose', from: 'hand', i: 0 });
  ok(!E.allCards(p).includes('TROP') && !s.pending.length, 'Tropeção destruído');
  p.hand = ['DIAR']; p.deck = ['LAMP', 'BARG'];
  X(s, { t: 'play', hi: 0 });
  ok(p.hand.length === 2 && s.pending[0].k === 'discard1', 'Diário: compra 2 e descarta 1');
  X(s, { t: 'choose', i: 0 });
  ok(p.hand.length === 1, 'descartou 1');
  s.row[0] = 'MOLE'; p.hand = ['CAPT'];
  X(s, { t: 'play', hi: 0 });
  X(s, { t: 'choose', i: 0 });
  ok(p.discard.includes('MOLE') && p.t.prosa === 2, 'Capataz: 🤝2 e ganha carta de custo ≤3');
}

// 8) DLC Cérbero
{
  const s = game(2, ['cerbero']);
  const p = cur(s); const q = s.players[1];
  ok(s.cerb.node === 'E3' && s.cerb.awake === 0 && s.relics.E3 === 'R25c', 'Cérbero dorme no Covil com a Coleira de Bronze');
  ok(s.tunnel.concat(s.row).includes('BOLO'), 'cartas da DLC entram no Túnel');
  q.node = 'D5'; q.relics = ['R20b'];
  s.bag = { stone: 4, p: [0, 0] };
  E.fury(s);
  ok(s.cerb.awake === 1 && s.cerb.node === 'D5' && q.folego === 9, 'Fúria acorda 1 cabeça; ele anda até quem tem Relíquia e morde 🫧1');
  pool(p, 0, 4);
  ok(X(s, { t: 'calm' }) === null && s.cerb.awake === 0, 'acalmar com 🤝4');
  s.cerb.awake = 2; p.node = 'D4'; pool(p, 1);
  X(s, { t: 'move', to: 'D5' });
  ok(p.folego === 9, 'entrar no nó do Cérbero acordado: mordida');
  pool(p, 0, 0, 7);
  ok(X(s, { t: 'fightCerb' }) === null && s.cerb.node === 'E3' && s.cerb.awake === 0 && p.discard.includes('TCER') && p.gold === 3, 'enfrentar com ⛏7: volta ao Covil, 🟡3 e troféu');
}

// 9) DLC Medusa
{
  const s = game(2, ['medusa']);
  const p = cur(s); const q = s.players[1];
  ok(s.medusa.node === 'D4' && s.relics.C2 === 'R20c', 'Medusa começa no Veio; Véu na Galeria 3');
  p.node = 'D5'; q.node = 'D3';
  const vis = E.medusaSees(s);
  ok(vis.has('D5') && !vis.has('D3'), 'túnel escuro bloqueia a visão (D4–D3 é escuro)');
  p.mirror = true; q.node = 'D4';
  s.bag = { stone: 4, p: [0, 0] };
  E.fury(s);
  ok(!p.mirror && !p.discard.includes('PEDR'), 'espelho reflete o olhar');
  ok(q.discard.includes('PEDR') && q.folego === 9, 'no mesmo nó: Petrificado e 🫧1');
  q.hand = ['ESCU']; s.turn = 1; q.t = { ...p.t };
  X(s, { t: 'play', hi: 0 });
  ok(!E.allCards(q).includes('PEDR'), 'Escultor se livra do Petrificado');
  ok(E.scoreOf(s, { ...q, deck: ['PEDR'], hand: [], discard: [], play: [] }).cards === -1, 'Petrificado vale ✦-1');
}

// 10) bots terminam partidas em todos os modos, de forma determinística
for (const dlc of [[], ['cerbero'], ['medusa'], ['cerbero', 'medusa']]) {
  for (const np of [1, 2, 3, 4]) {
    const mk = () => { const s = E.newGame({ players: Array.from({ length: np }, (_, i) => ({ name: 'B' + i, bot: true })), seed: 42 + np, dlc }); B.runBots(s, 3000); return s; };
    const a = mk(); const b = mk();
    ok(a.over && JSON.stringify(a.winners) === JSON.stringify(b.winners) && a.turnNo === b.turnNo, `bots: ${np}p [${dlc}] termina e repete com a mesma semente (${a.turnNo} voltas)`);
  }
}


// 11) exploração: peças de Sala
const xgame = (np = 2, dlc = [], seed = 7) => { const s = E.newGame({ players: Array.from({ length: np }, (_, i) => ({ name: 'J' + (i + 1) })), seed, dlc }); s.logCap = 1e5; return s; };
{
  const s = xgame();
  const p = cur(s);
  ok(E.nodeIds(s).join() === 'S1,S2,0:1' && s.map.mode === 'explorar', 'começa só com Boca, Barracão e Galeria de Entrada');
  ok(E.stubs(s, '0:1').map((x) => x.dir).join() === 'L,R,D', 'Entrada tem saídas para os dois lados e para baixo');
  p.node = '0:1'; pool(p, 5);
  s.map.decks.rasa.unshift('altar L:t R:t U:lad');
  ok(X(s, { t: 'explore', dir: 'R' }) === null && s.pending[0]?.k === 'place', 'explorar abre a escolha de lado da peça');
  X(s, { t: 'choose', mirror: false });
  ok(E.nodeIds(s).includes('1:1') && p.node === '1:1' && p.t.luz === 4, 'peça colocada e o explorador entra nela (🔦1)');
  ok(E.kindOf(s, '1:1') !== 'altar', 'Altar não aparece no nível 1: vai para o fundo do monte');
  ok(!!E.edgeBetween(s, '0:1', '1:1'), 'passagem entre a Entrada e a sala nova');
  p.node = '0:1'; pool(p, 5);
  s.map.decks.rasa.unshift('altar L:t R:t U:lad');
  X(s, { t: 'explore', dir: 'D' }); X(s, { t: 'choose', mirror: false });
  ok(E.kindOf(s, '0:2') === 'altar' && s.relics['0:2'] === 'R08', 'Altar no nível 2 recebe a 1ª Relíquia da pilha rasa (✦8)');
  ok(E.edgeBetween(s, '0:1', '0:2')?.type === 'lad', 'escada liga os níveis');
  ok(s.map.piles.rasa[0] === 'R10', 'a pilha sobe de valor: a próxima é ✦10');
}
{
  const s = xgame();
  const p = cur(s);
  p.node = '0:1'; pool(p, 5);
  s.map.decks.rasa.unshift('vazia L:t R:t D:rubble');
  X(s, { t: 'explore', dir: 'L' }); X(s, { t: 'choose', mirror: false });
  ok(E.exploreCost(s, p, 'D').err?.includes('desabamento'), 'saída com desabamento não se explora');
  pool(p, 1, 0, 3);
  ok(X(s, { t: 'clear', dir: 'D' }) === null && !E.exploreCost(s, p, 'D').err, 'limpar o desabamento com ⛏3 libera a saída');
  p.node = '0:1'; pool(p, 5);
  s.map.decks.rasa.unshift('respiro L:t R:dark D:lad');
  X(s, { t: 'explore', dir: 'R' }); X(s, { t: 'choose', mirror: true });
  ok(s.map.nodes['1:1'].exits.L.type === 'dark' && s.map.nodes['1:1'].exits.R.type === 't', 'espelhar troca as saídas da esquerda e da direita');
}
{
  const s = xgame();
  const p = cur(s);
  s.map.nodes['0:3'] = { lv: 3, x: 0, col: 0, kind: 'vazia', exits: { D: { type: 'lad' }, R: { type: 't' } } };
  s.map.edges.push({ a: '0:1', b: '0:3', type: 'lad', key: '0:1-0:3' });
  s.map.nodes['0:4'] = undefined; delete s.map.nodes['0:4'];
  s.map.decks.funda = ['ninho L:t R:t U:lad', 'vazia L:t R:t'];
  p.node = '0:3'; pool(p, 5);
  X(s, { t: 'explore', dir: 'D' }); X(s, { t: 'choose', mirror: false });
  ok(E.kindOf(s, '0:4') === 'vazia' && s.map.decks.funda[0].startsWith('ninho'), 'Ninho não entra no nível 4');
  s.map.decks.media = ['elevador L:t R:t'];
  p.node = '0:3'; pool(p, 5);
  X(s, { t: 'explore', dir: 'R' }); X(s, { t: 'choose', mirror: false });
  ok(E.edgeBetween(s, 'S1', '1:3')?.type === 'elev', 'Poço do Elevador liga a sala à Boca (🤝2)');
}
{
  const s = xgame();
  const p = cur(s);
  p.hand = ['TROP']; X(s, { t: 'play', hi: 0 });
  p.node = '0:1'; pool(p, 5);
  s.map.decks.rasa.unshift('capela L:t R:t');
  X(s, { t: 'explore', dir: 'L' }); X(s, { t: 'choose', mirror: false });
  ok(s.pending[0]?.k === 'trash', 'Capela: primeira visita abre destruir carta');
  X(s, { t: 'choose', from: 'play', i: p.play.indexOf('TROP') });
  ok(!E.allCards(p).includes('TROP'), 'Capela destrói o Tropeção jogado neste turno');
  s.row[0] = 'MOLE';
  s.map.decks.rasa.unshift('deposito L:t R:t');
  p.node = '0:1'; pool(p, 5);
  X(s, { t: 'explore', dir: 'R' }); X(s, { t: 'choose', mirror: false });
  ok(s.pending[0]?.k === 'gainCheap' && s.pending[0].max === 4, 'Depósito: ganha carta de custo até 4');
  X(s, { t: 'choose', i: 0 });
  ok(p.discard.includes('MOLE'), 'carta do Depósito vai para o descarte');
  const t = xgame(2);
  const first = t.row[0];
  X(t, { t: 'end' }); X(t, { t: 'end' });
  ok(!t.row.includes(first), 'fim da rodada: a carta mais antiga sai da Fila');
}
{
  const s = xgame(2, ['cerbero', 'medusa']);
  ok(!s.cerb && !s.medusa, 'sem Cérbero nem Medusa antes de achar as salas deles');
  ok(s.map.decks.funda.some((t) => t.startsWith('covil')) && [...s.map.decks.media, ...s.map.decks.funda].some((t) => t.startsWith('estatuas')), 'salas de DLC embaralhadas nos montes');
  ok(s.map.piles.funda.includes('R25c') && s.map.piles.media.includes('R20c'), 'Relíquias das DLCs nas pilhas');
  const p = cur(s);
  s.map.nodes['0:4'] = { lv: 4, x: 0, col: 0, kind: 'vazia', exits: { R: { type: 't' }, L: { type: 't' } } };
  s.map.edges.push({ a: '0:1', b: '0:4', type: 'lad', key: '0:1-0:4' });
  s.map.decks.funda.unshift('covil L:t R:t'); p.node = '0:4'; pool(p, 5);
  X(s, { t: 'explore', dir: 'R' }); X(s, { t: 'choose', mirror: false });
  ok(s.cerb?.node === '1:4' && s.cerb.lair === '1:4', 'Portão de Bronze revelado: o Cérbero aparece dormindo');
  s.map.decks.funda.unshift('estatuas L:t R:t'); p.node = '0:4'; pool(p, 5);
  X(s, { t: 'explore', dir: 'L' }); X(s, { t: 'choose', mirror: false });
  ok(s.medusa?.node === '-1:4', 'Jardim de Estátuas revelado: a Medusa aparece');
}
{
  let bad = 0; let unfinished = 0;
  for (let i = 1; i <= 300; i++) {
    const s = E.newGame({ players: [0, 1, 2, 3].map((k) => ({ name: 'B' + k, bot: true })), seed: i, dlc: i % 2 ? ['cerbero', 'medusa'] : [] });
    B.runBots(s, 3000);
    if (!s.over) unfinished++;
    for (const e of s.map.edges) if (!s.map.nodes[e.a] || !s.map.nodes[e.b]) bad++;
    const keys = s.map.edges.map((e) => e.key);
    if (new Set(keys).size !== keys.length) bad++;
  }
  ok(!bad && !unfinished, `300 partidas exploradas: todas terminam e o mapa não tem passagem quebrada (quebras ${bad}, sem fim ${unfinished})`);
}

console.log(fails ? `\n${fails} FALHA(S)` : '\nTudo certo.');
process.exitCode = fails ? 1 : 0;
