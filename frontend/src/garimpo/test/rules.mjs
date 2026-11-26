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
  ok(s.bag.stone === 24 && s.bag.p.join() === E.START_CUBES.join(), `Bateia: 24 pedras + ${E.START_CUBES.join('/')} cubos por ordem`);
  ok(s.fury === D.furyStart(4) && game(2).fury === D.furyStart(2), 'trilha da Fúria começa na casa do número de jogadores');
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
  p.node = 'A2'; p.dmg = 3; p.cubes -= 3; p.folego = 7; pool(p, 3);
  X(s, { t: 'move', to: 'A1' }); X(s, { t: 'move', to: 'A2' }); X(s, { t: 'move', to: 'A1' });
  ok(p.folego === 8 && p.dmg === 2, 'Respiro cura 🫧1 uma vez por turno (o cubo volta para a reserva)');
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
  const f0 = s.fury;
  ok(X(s, { t: 'take' }) === null && p.relics[0] === 'R10' && s.fury === f0 + 1, 'pegar Relíquia sobe a Fúria');
  p.node = 'C6';
  ok(X(s, { t: 'take' }) !== null, 'sem Mochila carrega só 1');
  p.items = ['mochila'];
  p.node = 'E2';
  ok(X(s, { t: 'take' }) === null && s.fury === f0 + 3, 'Ninho sobe a Fúria +2');
  s.bag = { stone: 0, p: [0, 2] };
  const q = s.players[1];
  p.hand = []; X(s, { t: 'end' });
  ok(q.folego === 8 && q.dmg === 2 && s.stats.furies === 1, 'pegar Relíquia dispara Fúria no fim do turno; os 2 cubos do J2 vão para o medidor dele');
  ok(cur(s).id === 1, 'passa a vez');
  X(s, { t: 'end' });
  ok(cur(s).id === 0 && cur(s).t.luz === 1, 'Adrenalina: com Relíquia, 🔦+1 no começo do turno');
  const s2 = game();
  s2.bag = { stone: 0, p: [0, 0] }; s2.fury = 1;
  E.fury(s2);
  ok(s2.furyExtra === 1, 'Bateia vazia: próxima Fúria tira +1');
}

// 5) saída, reta final, soterrado, pontuação
{
  const s = game(2);
  const p = cur(s); const q = s.players[1];
  p.node = 'A2'; p.relics = ['R15a']; pool(p, 2);
  X(s, { t: 'move', to: 'S1' });
  ok(p.status === 'out' && s.ending, 'sair com Relíquia: Selo e a mina começa a ruir');
  ok(cur(s).id === 1, 'turno de quem saiu acaba na hora');
  s.bag = { stone: 0, p: [0, 10] };
  q.hand = []; X(s, { t: 'end' }); while (s.pending.length) X(s, E.defaultChoice(s));
  ok(q.dmg === D.OUT_DRAWS(2) && s.stats.outDraws === 1, `turno de quem saiu: tira ${D.OUT_DRAWS(2)} cubos da Bateia (sem contar a Fúria); os de J2 viram dano`);
  ok(cur(s).id === 1 && p.status === 'out', 'quem saiu não joga: a vez volta para quem está na mina');
  s.bag = { stone: 0, p: [D.OUT_DRAWS(2), 0] }; const pc = p.cubes;
  q.hand = []; X(s, { t: 'end' }); while (s.pending.length) X(s, E.defaultChoice(s));
  ok(p.cubes === pc + D.OUT_DRAWS(2) && p.status === 'out', 'quem saiu não toma dano: o cubo dele volta para a reserva');
  ok(s.over && q.status === 'dead', 'Bateia vazia com alguém na mina: a mina desaba e a partida acaba');
  ok(E.scoreOf(s, p).selo === D.SELO && s.winners[0] === 0, `quem saiu ganha o Selo de Sobrevivente (✦${D.SELO})`);
  const s3 = game(2);
  const r = cur(s3); r.gold = 6;
  r.status = 'dead'; r.deadZone = 'segura'; r.relics = ['R10'];
  ok(E.scoreOf(s3, r).total === E.scoreOf(s3, { ...r, status: 'in' }).total, 'soterrado perto da Boca com Relíquia: a turma resgata, pontua tudo (sem Selo)');
  r.relics = [];
  ok(E.scoreOf(s3, r).total === 0, 'soterrado sem Relíquia: 0');
  r.relics = ['R10']; r.deadZone = 'fundo';
  ok(E.scoreOf(s3, r).total === 0, 'soterrado no fundo: 0');
  const s4 = game(2);
  const w = cur(s4); w.cubes = 1;
  w.node = 'A6'; pool(w, 3, 0, 0);
  X(s4, { t: 'move', to: 'A7' });
  ok(w.dmg === 1 && w.cubes === 0, 'dano fora da Fúria usa um cubo da sua reserva');
  w.node = 'A6'; pool(w, 3, 0, 0);
  X(s4, { t: 'move', to: 'A7' });
  ok(w.dmg === 1, 'sem cubos na reserva não há dano');
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
  pool(p, 0, 4);
  ok(X(s, { t: 'buy', src: 'fixed', id: 'QUER' }) === null && s.fixedQty.QUER === 11 && p.t.prosa === 0, 'compra fixa (Lampião a Querosene custa 🤝4)');
  p.node = 'B3';
  ok(X(s, { t: 'mascate', item: 'capacete' }) === null && p.gold === 0 && E.hasItem(p, 'capacete'), 'Mascate: Capacete por 🟡5');
  p.gold = 9;
  ok(X(s, { t: 'mascate', item: 'corda' }) !== null, 'uma compra no Mascate por turno');
  p.node = 'S2'; p.dmg = 5; p.cubes -= 5; p.folego = 5; pool(p, 0, 2);
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


// 11) exploração: peças de mina com várias salas
const xgame = (np = 2, dlc = [], seed = 7) => { const s = E.newGame({ players: Array.from({ length: np }, (_, i) => ({ name: 'J' + (i + 1) })), seed, dlc }); s.logCap = 1e5; return s; };
const tileOf = (lay, k, t, e, zone = 'fundo') => ({ lay, k, t, e, zone });
{
  const s = xgame();
  const p = cur(s);
  ok(E.nodeIds(s).length === 5 && s.map.mode === 'explorar' && p.node === E.bocaOf(s) && E.kindOf(s, E.bocaOf(s)) === 'boca', 'começa com a peça da Boca: 5 salas, todos na Boca');
  ok(E.neighbors(s, E.bocaOf(s)).length === 4, 'Boca ligada às 4 salas da peça inicial');
  const north = '0,0.1';
  ok(E.stubs(s, north).map((x) => x.dir).join() === 'N', 'a sala do norte tem saída para o escuro');
  ok(s.map.stack.slice(0, D.SAFE_TILES_USED).every((t) => t.zone === 'segura') && s.map.stack.length === D.SAFE_TILES_USED + D.TILES.fundo.length + 1, '4 peças seguras em cima do monte do Fundo (com o Ninho)');
  p.node = north; pool(p, 5);
  s.map.stack.unshift(tileOf('tee', ['vazia', 'vazia', 'altar', 'respiro'], ['t', 't', 't'], { W: 't', E: 't', S: 't' }, 'segura'));
  ok(X(s, { t: 'explore', dir: 'N' }) === null && s.pending[0]?.k === 'place', 'explorar abre a escolha de rotação');
  const pd = s.pending[0];
  ok(pd.rots.length >= 1 && pd.rots.every((r) => E.buildTile(pd.tile, r).edge.S), 'só valem as rotações que encaixam na borda por onde você entra');
  const bad = [0, 1, 2, 3].find((r) => !pd.rots.includes(r));
  ok(bad === undefined || X(s, { t: 'choose', rot: bad }) !== null, 'rotação que não encaixa é recusada');
  X(s, { t: 'choose', rot: pd.rots[0] });
  const ids = E.nodeIds(s).filter((n) => n.startsWith('0,-1.'));
  ok(ids.length === 4 && p.node.startsWith('0,-1.') && p.t.luz === 4, 'peça de 4 salas colocada ao norte; o explorador entra pela sala da borda (🔦1)');
  ok(!!E.edgeBetween(s, north, p.node), 'túnel atravessa a borda entre as duas peças');
  const altar = ids.find((n) => E.kindOf(s, n) === 'altar');
  ok(s.relics[altar] === 'R08', 'Altar a 1 peça da Boca recebe a 1ª Relíquia da pilha rasa (✦8)');
  ok(s.map.piles.rasa[0] === 'R09', 'a pilha sobe de valor');
}
{
  const s = xgame();
  const p = cur(s);
  p.node = '0,0.2'; pool(p, 5);
  s.map.stack.unshift(tileOf('reta', ['vazia', 'vazia', 'vazia'], ['t', 't'], { N: 't', S: 't', E: 'rub', W: 't' }));
  X(s, { t: 'explore', dir: 'E' }); X(s, { t: 'choose', rot: s.pending[0].rots[0] });
  const st = E.stubs(s, p.node);
  ok(st.length >= 1, 'a sala nova tem saídas para o escuro');
  const rub = E.nodeIds(s).flatMap((n) => E.stubs(s, n)).find((x) => x.pass.type === 'rubble');
  if (rub) {
    const from = E.nodeIds(s).find((n) => E.stubs(s, n).includes(rub) || E.stubs(s, n).some((x) => x.cell === rub.cell && x.dir === rub.dir));
    p.node = from; pool(p, 1, 0, 0);
    ok(E.exploreCost(s, p, rub.dir).err?.includes('desabamento'), 'saída com desabamento não se explora');
    pool(p, 1, 0, 3);
    ok(X(s, { t: 'clear', dir: rub.dir }) === null && !E.exploreCost(s, p, rub.dir).err, 'limpar o desabamento com ⛏3 libera a saída');
  } else ok(true, 'desabamento ficou virado para uma peça vizinha');
}
{
  const s = xgame();
  const p = cur(s);
  p.node = '0,0.3'; pool(p, 5);
  s.map.stack.unshift(tileOf('duas', ['elevador', 'geodo'], ['t'], { W: 't', E: 't', N: 't', S: 't' }));
  X(s, { t: 'explore', dir: 'S' }); X(s, { t: 'choose', rot: s.pending[0].rots[0] });
  const el = E.nodeIds(s).find((n) => E.kindOf(s, n) === 'elevador');
  ok(E.edgeBetween(s, E.bocaOf(s), el)?.type === 'elev', 'Poço do Elevador liga a sala à Boca (🤝2)');
  const geo = E.nodeIds(s).find((n) => E.kindOf(s, n) === 'geodo');
  if (p.node !== geo) { pool(p, 3); X(s, { t: 'move', to: geo }); }
  ok(p.node === geo && p.t.tired && p.t.luz === 0 && p.crystals === 1, 'Geodo: pega 💠 e cansa (acaba o movimento do turno)');
  pool(p, 3);
  const any = E.neighbors(s, p.node)[0].to;
  ok(X(s, { t: 'move', to: any }) !== null, 'cansado não anda mais neste turno');
}
{
  const s = xgame();
  const p = cur(s);
  p.hand = ['TROP']; X(s, { t: 'play', hi: 0 });
  p.node = '0,0.1'; pool(p, 5);
  s.map.stack.unshift(tileOf('duas', ['capela', 'deposito'], ['t'], { W: 't', E: 't', N: 't', S: 't' }, 'segura'));
  X(s, { t: 'explore', dir: 'N' }); X(s, { t: 'choose', rot: s.pending[0].rots[0] });
  const firstKind = E.kindOf(s, p.node);
  ok(s.pending[0]?.k === (firstKind === 'capela' ? 'trash' : 'gainCheap'), 'primeira visita abre a escolha da sala');
  if (firstKind === 'capela') {
    X(s, { t: 'choose', from: 'play', i: p.play.indexOf('TROP') });
    ok(!E.allCards(p).includes('TROP'), 'Capela destrói o Tropeção jogado neste turno');
  } else { X(s, { t: 'choose', skip: true }); ok(true, 'Depósito: pode pular'); }
  const t = xgame(2);
  const first = t.row[0];
  X(t, { t: 'end' }); X(t, { t: 'end' });
  ok(!t.row.includes(first), 'fim da rodada: a carta mais antiga sai da Fila');
}
{
  const s = xgame(2, ['cerbero', 'medusa']);
  ok(!s.cerb && !s.medusa, 'sem Cérbero nem Medusa antes de achar as salas deles');
  ok(s.map.stack.some((t) => t.k.includes('covil')) && s.map.stack.some((t) => t.k.includes('estatuas')), 'salas de chefe embaralhadas no monte do Fundo');
  ok(s.map.piles.funda.includes('R25c') && s.map.piles.media.includes('R20c'), 'Relíquias das DLCs nas pilhas');
  const p = cur(s);
  p.node = '0,0.1'; pool(p, 5);
  s.map.stack.unshift(tileOf('cruz', ['covil', 'vazia', 'vazia', 'vazia', 'vazia'], ['t', 't', 't', 't'], { N: 't', E: 't', S: 't', W: 't' }));
  X(s, { t: 'explore', dir: 'N' }); X(s, { t: 'choose', rot: 0 });
  ok(s.cerb && E.kindOf(s, s.cerb.node) === 'covil', 'Portão de Bronze revelado: o Cérbero aparece dormindo');
  p.node = '0,0.2'; pool(p, 5);
  s.map.stack.unshift(tileOf('cruz', ['estatuas', 'vazia', 'vazia', 'vazia', 'vazia'], ['t', 't', 't', 't'], { N: 't', E: 't', S: 't', W: 't' }));
  X(s, { t: 'explore', dir: 'E' }); X(s, { t: 'choose', rot: 0 });
  ok(s.medusa && E.kindOf(s, s.medusa.node) === 'estatuas', 'Jardim de Estátuas revelado: a Medusa aparece');
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


// 12) famílias e combos (valem no turno inteiro)
{
  const mk = () => { const s = game(2); const p = cur(s); p.deck = ['LAMP', 'LAMP', 'LAMP', 'LAMP', 'LAMP', 'LAMP']; return [s, p]; };
  {
    const [s, p] = mk();
    p.hand = ['MOLE', 'FERR'];
    X(s, { t: 'play', hi: 0 });
    ok(p.t.luz === 1 && p.t.armed.includes('MOLE'), 'Moleque sozinho: 🔦1 e o combo fica armado');
    X(s, { t: 'play', hi: p.hand.indexOf('FERR') });
    ok(p.t.luz === 1 + 1 + 1 && p.t.pic === 3 + 1 && p.t.combos.length === 2, 'Irmãos Ferreira entra: dispara o combo armado do Moleque (+🔦1) e o próprio (+⛏1)');
  }
  {
    const [s, p] = mk(); const [s2, p2] = mk();
    p.hand = ['MOLE', 'FERR']; p2.hand = ['FERR', 'MOLE'];
    X(s, { t: 'playAll' }); X(s2, { t: 'playAll' });
    ok(p.t.luz === p2.t.luz && p.t.pic === p2.t.pic, 'a ordem não importa: mesmo resultado jogando em qualquer ordem');
  }
  {
    const [s, p] = mk();
    p.hand = ['MOLE', 'ACO'];
    X(s, { t: 'playAll' });
    ok(p.t.combos.length === 0 && p.t.armed.length === 2, 'famílias diferentes não fazem combo');
  }
  {
    const [s, p] = mk();
    p.hand = ['MOLE', 'CAPT', 'ZEFA'];
    X(s, { t: 'play', hi: 0 });
    X(s, { t: 'play', hi: p.hand.indexOf('CAPT') }); while (s.pending.length) X(s, E.defaultChoice(s));
    ok(p.t.prosa === 1 + 1, 'Capataz: 🤝1 + 🤝1 pelo Moleque jogado antes');
    X(s, { t: 'play', hi: p.hand.indexOf('ZEFA') });
    ok(p.t.prosa === 2 + 1 + 1, 'Dona Zefa depois: 🤝1 dela + 🤝1 do Capataz por mais um da Turma');
  }
  {
    const [s, p] = mk();
    p.hand = ['LAMP', 'BARG', 'QUER'];
    X(s, { t: 'playAll' });
    ok(!p.t.armed.length && !p.t.combos.length, 'iniciais e loja base não têm família');
    ok(D.CARDS.MOLE.fam === 'turma' && D.CARDS.ACO.fam === 'oficina' && D.CARDS.PEPE.fam === 'colecao', 'famílias vêm do tipo da carta');
  }
  {
    const [s, p] = mk();
    p.hand = ['MOLE', 'FERR', 'TIAO'];
    X(s, { t: 'playAll' });
    ok(p.t.combos.filter((x) => x === 'MOLE').length === 1, 'cada combo dispara uma vez por turno');
  }
}

console.log(fails ? `\n${fails} FALHA(S)` : '\nTudo certo.');
process.exitCode = fails ? 1 : 0;
