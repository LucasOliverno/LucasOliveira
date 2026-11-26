// GARIMPO — dados do jogo: mapa em corte, cartas, Mascate, Relíquias.
// Fonte: GARIMPO/00_design.md. Valores marcados (PT) dependem de playtest.

export const HAND = 5;
export const ROW_SIZE = 6;
export const MAX_FOLEGO = 10; // casas do medidor de Fôlego (cubos de dano)
export const CUBES_PER_PLAYER = 30;
export const START_STONES = 24; // pedras pretas na Bateia no começo
export const FURY_DRAWS = [2, 2, 3, 3, 4, 4, 5]; // (PT) cubos tirados em cada casa da trilha da Fúria
export const furyStart = (np) => Math.min(np, 4); // começa na casa do número de jogadores
export const OUT_DRAWS = (np) => +(globalThis.process?.env?.OUT_DRAWS ?? 0) || (np <= 2 ? 5 : 3); // turno de quem já saiu: tira esse tanto, sem contar a Fúria
export const SELO = 20;
export const WATER_START = +(globalThis.process?.env?.WATER_START ?? 9); // (PT) cada tique do relógio sobe 1 nível; 8, 7 e 6 são voltas de folga antes de alagar a Câmara (5)
export const WATER_DMG = 2;
export const PLAYER_COLORS = ['urucum', 'anil', 'mata', 'ipe'];

export const LEVELS = ['Superfície', 'Galeria 1', 'Galeria 2', 'Galeria 3', 'Veio Profundo', 'Câmara da Mãe-do-Ouro'];

// ------------------------------------------------------------------ mapa
// x: 0..10 da esquerda para a direita; lv: 0 (superfície) .. 5 (câmara).
// kind: boca | barracao | elevador | mascate | altar | geodo | ninho | (vazio)
export const NODES = {
  S1: { lv: 0, x: 2, kind: 'boca' },
  S2: { lv: 0, x: 5, kind: 'barracao' },
  S3: { lv: 0, x: 8, kind: 'elevador' },
  A1: { lv: 1, x: 1, kind: 'respiro' }, A2: { lv: 1, x: 2.5 }, A3: { lv: 1, x: 4 }, A4: { lv: 1, x: 5.5 },
  A5: { lv: 1, x: 7 }, A6: { lv: 1, x: 8.5 }, A7: { lv: 1, x: 10 },
  B1: { lv: 2, x: 0.5 }, B2: { lv: 2, x: 2 }, B3: { lv: 2, x: 3.5, kind: 'mascate' }, B4: { lv: 2, x: 5 },
  B5: { lv: 2, x: 6.5 }, B6: { lv: 2, x: 8, kind: 'elevador' }, B7: { lv: 2, x: 9.5, kind: 'altar', relic: 'R10' },
  C1: { lv: 3, x: 1 }, C2: { lv: 3, x: 2.5 }, C3: { lv: 3, x: 4.5 }, C4: { lv: 3, x: 6, kind: 'altar', relic: 'R15a' },
  C5: { lv: 3, x: 7.5 }, C6: { lv: 3, x: 9.5, kind: 'altar', relic: 'R15b' },
  D1: { lv: 4, x: 1, kind: 'geodo' }, D2: { lv: 4, x: 2.5, kind: 'geodo' }, D3: { lv: 4, x: 4, kind: 'altar', relic: 'R20a' },
  D4: { lv: 4, x: 5.5, kind: 'geodo' }, D5: { lv: 4, x: 7, kind: 'altar', relic: 'R20b' }, D6: { lv: 4, x: 9, kind: 'geodo' },
  E1: { lv: 5, x: 2, kind: 'altar', relic: 'R25' }, E2: { lv: 5, x: 5, kind: 'ninho', relic: 'R30' }, E3: { lv: 5, x: 8 },
};
export const NODE_IDS = Object.keys(NODES);
export const BOCA = 'S1';
export const MASCATE_NODE = 'B3';
export const BARRACAO_NODE = 'S2';
export const CRYSTALS_PER_GEODE = 2;

// Arestas. type: t (túnel) | lad (escada; a = de cima) | shaft (poço, só desce a→b) | dark | rail | elev
// den: Toca de Bicho (pague ⛏1 ou perca 🫧1 ao atravessar)
// As galerias vão e voltam: cada nível desce pelo lado oposto ao que você chegou. Atalhos: poços, trilhos,
// elevador e as escadas do meio (começam bloqueadas por desabamento).
export const EDGES = [
  { a: 'S1', b: 'S2', type: 't' }, { a: 'S2', b: 'S3', type: 't' },
  { a: 'S1', b: 'A2', type: 'lad' }, { a: 'S3', b: 'B6', type: 'elev' },
  { a: 'A1', b: 'A2', type: 't' }, { a: 'A2', b: 'A3', type: 't' }, { a: 'A3', b: 'A4', type: 'rail' },
  { a: 'A4', b: 'A5', type: 'rail' }, { a: 'A5', b: 'A6', type: 'rail' }, { a: 'A6', b: 'A7', type: 't', den: true },
  { a: 'A7', b: 'B7', type: 'lad' }, { a: 'A4', b: 'B4', type: 'lad' }, { a: 'A6', b: 'C5', type: 'shaft' },
  { a: 'B1', b: 'B2', type: 't' }, { a: 'B2', b: 'B3', type: 't' }, { a: 'B3', b: 'B4', type: 't' },
  { a: 'B4', b: 'B5', type: 'rail' }, { a: 'B5', b: 'B6', type: 'rail' }, { a: 'B6', b: 'B7', type: 'dark', den: true },
  { a: 'B1', b: 'C1', type: 'lad' }, { a: 'B2', b: 'D2', type: 'shaft' },
  { a: 'C1', b: 'C2', type: 'dark' }, { a: 'C2', b: 'C3', type: 't' }, { a: 'C3', b: 'C4', type: 't', den: true },
  { a: 'C4', b: 'C5', type: 't' }, { a: 'C5', b: 'C6', type: 'dark' },
  { a: 'C6', b: 'D6', type: 'lad' }, { a: 'C3', b: 'D3', type: 'lad' },
  { a: 'D1', b: 'D2', type: 't' }, { a: 'D2', b: 'D3', type: 't', den: true }, { a: 'D3', b: 'D4', type: 'dark' },
  { a: 'D4', b: 'D5', type: 't' }, { a: 'D5', b: 'D6', type: 'dark' },
  { a: 'D1', b: 'E1', type: 'lad' }, { a: 'D5', b: 'E3', type: 'lad' },
  { a: 'E1', b: 'E2', type: 't' }, { a: 'E2', b: 'E3', type: 't' },
];
export const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
export const START_RUBBLE = [edgeKey('A4', 'B4'), edgeKey('C3', 'D3')];

// ------------------------------------------------------------------ relíquias e Mascate
export const RELICS = {
  R10: { name: 'Bateia do Primeiro Garimpeiro', pts: 10, model: 'reliquia_bateia' },
  R15a: { name: 'Lampião de Prata', pts: 15, model: 'reliquia_lampiao' },
  R15b: { name: 'Sino da Capela Soterrada', pts: 15, model: 'reliquia_sino' },
  R20a: { name: 'Coroa de Quartzo-Rosa', pts: 20, model: 'reliquia_coroa' },
  R20b: { name: 'Ferradura de Ouro', pts: 20, model: 'reliquia_ferradura' },
  R25: { name: 'Olho de Topázio', pts: 28, model: 'reliquia_topazio' },
  R30: { name: 'Escama da Mãe-do-Ouro', pts: 25, model: 'reliquia_escama', fury: 2 },
};

export const MASCATE = {
  capacete: { name: 'Capacete com Luz', gold: 5, qty: 2, pts: 3, model: 'mascate_capacete' },
  corda: { name: 'Corda Nova', gold: 4, qty: 2, pts: 0, model: 'mascate_corda' },
  mochila: { name: 'Mochila', gold: 6, qty: 2, pts: 3, model: 'mascate_mochila' },
  cantil: { name: 'Cantil de Ar', gold: 3, qty: 2, pts: 0, folego: 3, model: 'mascate_cantil' },
};

// ------------------------------------------------------------------ cartas
// luz/prosa/pic: recursos ao jogar · est: 💥 ao jogar (negativo tira) · draw · gold · folego · pts (✦ no fim)
// acq: efeito ao adquirir · fx: efeito especial ao jogar · quake: 🌋
// Bichos: fight (⛏ para derrotar) e reward · onEnter: efeito ao entrar na Fila
export const CARDS = {
  // inicial
  LAMP: { name: 'Lamparina', type: 'start', luz: 1 },
  BARG: { name: 'Barganha', type: 'start', prosa: 1 },
  PICG: { name: 'Picareta Gasta', type: 'start', pic: 1 },
  TROP: { name: 'Tropeção', type: 'start', luz: 1, est: 2 },
  // mercado fixo
  QUER: { name: 'Lampião a Querosene', type: 'fixed', cost: 4, luz: 2, qty: 12 },
  CABO: { name: 'Cabo da Turma', type: 'fixed', cost: 3, pic: 2, qty: 12 },
  MAPV: { name: 'Mapa do Veio', type: 'fixed', cost: 7, pts: 7, qty: 12 },
  RATO: { name: 'Rato-de-Mina', type: 'beast', fixed: true, fight: 2, reward: { gold: 1 } },
  // Túnel — ferramentas
  CARB: { name: 'Lanterna de Carbureto', type: 'tool', cost: 3, qty: 3, luz: 2, est: -1 },
  ACO: { name: 'Picareta de Aço', type: 'tool', cost: 3, qty: 3, pic: 2 },
  SISAL: { name: 'Corda de Sisal', type: 'tool', cost: 2, qty: 2, luz: 1, fx: 'ropeUp' },
  CAPA: { name: 'Capacete Amassado', type: 'tool', cost: 2, qty: 2, pic: 1, est: -1 },
  DINA: { name: 'Dinamite', type: 'tool', cost: 4, qty: 2, pic: 4, est: 3, fx: 'dyn', quake: true },
  BPRA: { name: 'Bateia de Prata', type: 'tool', cost: 4, qty: 2, gold: 2, pts: 1 },
  DETE: { name: 'Detector de Veio', type: 'tool', cost: 4, qty: 1, draw: 2, fx: 'detector', pts: 1 },
  CARR: { name: 'Carrinho Desgovernado', type: 'tool', cost: 3, qty: 2, fx: 'freeRide', est: 1 },
  MAPG: { name: 'Mapa da Galeria Esquecida', type: 'tool', cost: 5, qty: 1, luz: 1, fx: 'darkCheap', pts: 3 },
  // companheiros
  TIAO: { name: 'Seu Tião, o Guia', type: 'ally', cost: 5, qty: 1, luz: 2, draw: 1, pts: 2 },
  ZEFA: { name: 'Dona Zefa, Cozinheira', type: 'ally', cost: 3, qty: 1, folego: 2, prosa: 1 },
  MASC: { name: 'Mascate Ambulante', type: 'ally', cost: 4, qty: 3, prosa: 3, acq: { gold: 1 } },
  FERR: { name: 'Irmãos Ferreira', type: 'ally', cost: 5, qty: 1, pic: 3, luz: 1, pts: 2 },
  MOLE: { name: 'Moleque Ligeiro', type: 'ally', cost: 3, qty: 2, luz: 1, draw: 1 },
  CANT: { name: 'Cantadeira de Moda', type: 'ally', cost: 4, qty: 1, prosa: 1, est: -3, pts: 1 },
  CAPT: { name: 'Capataz Arrependido', type: 'ally', cost: 4, qty: 1, prosa: 2, fx: 'gainCheap' },
  BENZ: { name: 'Benzedeira', type: 'ally', cost: 4, qty: 1, folego: 1, fx: 'trash' },
  CONT: { name: 'Contrabandista', type: 'ally', cost: 3, qty: 3, prosa: 3, est: 2, quake: true },
  FIAD: { name: 'Caderneta de Fiado', type: 'tool', cost: 2, qty: 3, prosa: 2 },
  LMAO: { name: 'Lampião de Mão', type: 'tool', cost: 2, qty: 3, luz: 1, prosa: 1 },
  COMP: { name: 'Comprador de Ouro', type: 'ally', cost: 4, qty: 2, prosa: 2, gold: 1 },
  // achados
  PEPE: { name: 'Pepita Encravada', type: 'find', cost: 5, qty: 2, gold: 1, pts: 4 },
  FOSS: { name: 'Fóssil de Preguiça-Gigante', type: 'find', cost: 6, qty: 1, pts: 5, acq: { est: 2 } },
  DIAR: { name: 'Diário do Engenheiro', type: 'find', cost: 3, qty: 1, draw: 2, fx: 'discard1', pts: 1 },
  TOLO: { name: 'Ouro-de-Tolo', type: 'find', cost: 2, qty: 2, est: 1, acq: { gold: 3 } },
  // bichos (Fila)
  MORC: { name: 'Morcego-Vampiro', type: 'beast', qty: 3, fight: 2, reward: { gold: 1, luz: 1 } },
  ARAN: { name: 'Aranha-Caranguejeira', type: 'beast', qty: 2, fight: 3, reward: { gold: 2 } },
  COBR: { name: 'Cobra-Cega', type: 'beast', qty: 2, fight: 2, reward: { draw: 1 } },
  LOBI: { name: 'Lobisomem do Turno da Noite', type: 'beast', qty: 1, fight: 5, reward: { gold: 4, trophy: 'TROF' }, quake: true },
  BOIT: { name: 'Boitatá Filhote', type: 'beast', qty: 1, fight: 4, reward: { crystal: 1, est: 2 }, quake: true },
  CSEC: { name: 'Corpo-Seco', type: 'beast', qty: 1, fight: 4, reward: { gold: 3 }, onEnter: 'allLose1' },
  TROF: { name: 'Troféu do Lobisomem', type: 'trophy', pts: 3 },
  // perigos
  GRIS: { name: 'Grisu', type: 'hazard', qty: 2, onEnter: 'grisu' },
  INFI: { name: 'Infiltração', type: 'hazard', qty: 1, onEnter: 'infiltra' }, // todos fazem 💥1
  RACH: { name: 'Rachadura', type: 'hazard', qty: 2, quake: true },

  // ---------------- DLC 1: Cérbero, o Cão do Portão (dlc: 'cerbero')
  BOLO: { name: 'Bolo de Mel', type: 'tool', dlc: 'cerbero', cost: 3, qty: 2, est: -1, fx: 'calm' },
  LIRA: { name: 'Viola de Três Cordas', type: 'ally', dlc: 'cerbero', cost: 5, qty: 1, prosa: 2, fx: 'calm', pts: 1 },
  OSSO: { name: 'Osso Gigante', type: 'find', dlc: 'cerbero', cost: 4, qty: 2, pic: 1, fx: 'lure', pts: 1 },
  UIVO: { name: 'Uivo Triplo', type: 'hazard', dlc: 'cerbero', qty: 2, onEnter: 'wakeHead' },
  TCER: { name: 'Coleira do Cérbero', type: 'trophy', pts: 4 },

  // ---------------- DLC 2: Medusa, a Górgona do Veio (dlc: 'medusa')
  ESPE: { name: 'Espelho de Bronze', type: 'tool', dlc: 'medusa', cost: 4, qty: 2, pic: 1, fx: 'mirror' },
  VEND: { name: 'Venda nos Olhos', type: 'tool', dlc: 'medusa', cost: 2, qty: 2, luz: 1, fx: 'mirror', est: 1 },
  ESCU: { name: 'Escultor de Pedra-Sabão', type: 'ally', dlc: 'medusa', cost: 4, qty: 1, prosa: 2, fx: 'carveStone', pts: 1 },
  OLHA: { name: 'Olhar da Górgona', type: 'hazard', dlc: 'medusa', qty: 2, onEnter: 'gaze' },
  PEDR: { name: 'Petrificado', type: 'curse', pts: -1 },
  TMED: { name: 'Escama da Górgona', type: 'trophy', pts: 4 },
};
for (const [id, c] of Object.entries(CARDS)) c.id = id;

export const STARTER = (globalThis.process?.env?.STARTER || 'LAMP*1,BARG*7,PICG,TROP').split(',').flatMap((x) => { const [id, n] = x.split('*'); return Array(Number(n || 1)).fill(id); });
export const FIXED = ['QUER', 'CABO', 'MAPV'];
export const FIXED_BEAST = 'RATO';
export const tunnelFor = (dlc = []) => Object.values(CARDS)
  .filter((c) => !c.fixed && c.qty && ['tool', 'ally', 'find', 'beast', 'hazard'].includes(c.type))
  .filter((c) => !c.dlc || dlc.includes(c.dlc))
  .flatMap((c) => Array(c.qty).fill(c.id));
export const TUNNEL = tunnelFor();

// ------------------------------------------------------------------ DLCs
export const DLCS = {
  cerbero: {
    name: 'Cérbero, o Cão do Portão',
    lair: 'E3', // o Covil fica na Câmara
    heads: 3,
    biteDmg: 1,
    calmCost: 4, // 🤝 para fazer uma cabeça dormir
    fightCost: 7, // ⛏ para mandar de volta ao Covil
    fightReward: { gold: 3, trophy: 'TCER' },
    relic: { node: 'E3', id: 'R25c' },
  },
  medusa: {
    name: 'Medusa, a Górgona do Veio',
    start: 'D4',
    fightCost: 6,
    fightReward: { crystal: 2, trophy: 'TMED' },
    relic: { node: 'C2', id: 'R20c' },
  },
};
RELICS.R25c = { name: 'Coleira de Bronze', pts: 25, model: 'reliquia_coleira', dlc: 'cerbero' };
RELICS.R20c = { name: 'Véu da Górgona', pts: 20, model: 'reliquia_veu', dlc: 'medusa' };

// ------------------------------------------------------------------ Salas (mapa aleatório)
// Cada nível tem vagas; na preparação as salas são sorteadas do baralho da profundidade.
// first: efeito na primeira visita de cada jogador · enter: efeito a cada entrada (uma vez por turno)
export const ROOMS = {
  vazia: { name: 'Galeria Vazia' },
  entrada: { name: 'Galeria de Entrada', desc: 'onde todo mundo começa, logo abaixo da Boca' },
  altar: { name: 'Altar', desc: 'ao ser revelada, recebe a próxima Relíquia da pilha desta profundidade' },
  elevador: { name: 'Poço do Elevador', desc: 'ligada à Boca por um elevador de gaiola (🤝2, 💥1)' },
  respiro: { name: 'Respiro', enter: 'breathe', desc: 'ao entrar, 🫧+1 (uma vez por turno)' },
  geodo: { name: 'Geodo', desc: 'primeira visita: pegue 💠 e faça 💥2 (2 Cristais por Geodo)' },
  veio: { name: 'Veio de Ouro', first: 'gold2', desc: 'primeira visita: +🟡2' },
  eco: { name: 'Câmara do Eco', enter: 'echo', desc: 'ao entrar, 💥1' },
  capela: { name: 'Capela Soterrada', first: 'pray', desc: 'primeira visita: pode destruir 1 carta da mão ou do descarte' },
  deposito: { name: 'Depósito Abandonado', first: 'stash', desc: 'primeira visita: ganhe de graça 1 carta da Fila de custo até 🤝4' },
  mascate: { name: 'Mascate', desc: 'compre itens com 🟡' },
  ninho: { name: 'Ninho da Mãe-do-Ouro', desc: 'a Escama (✦35) fica aqui desde o começo' },
  // DLC Cérbero
  covil: { name: 'Portão de Bronze', dlc: 'cerbero', lair: 'cerb', desc: 'Covil do Cérbero' },
  canil: { name: 'Canil Abandonado', dlc: 'cerbero', first: 'bone', desc: 'primeira visita: ganhe um Osso Gigante' },
  // DLC Medusa
  estatuas: { name: 'Jardim de Estátuas', dlc: 'medusa', lair: 'medusa', desc: 'onde a Medusa começa' },
  espelhos: { name: 'Salão dos Espelhos', dlc: 'medusa', enter: 'mirror', desc: 'ao entrar, ganhe um espelho' },
  pedreira: { name: 'Pedreira de Pedra-Sabão', dlc: 'medusa', enter: 'unstone', desc: 'ao entrar, destrua 1 Petrificado' },
};
// ------------------------------------------------------------------ Peças de mina (exploração)
// A mina se espalha a partir da Boca, sem níveis. Cada peça é um quadrado 3×3 com 2 a 5 salas ligadas por túneis.
// As saídas ficam no meio de cada borda (N, L, S, O) e continuam na peça vizinha. Ao colocar uma peça você escolhe
// a rotação, e ela precisa ter saída na borda por onde você entrou.
// Túneis: t (🔦1) · dark = apertado (🔦2, ou 🔦1 depois de carta com 🔦2+) · rail = trilho · den = Toca de Bicho
//         dden = apertado com Toca · ramp = rampa de mão única (da 1ª para a 2ª sala) · rub = desabamento (⛏3 abre)
export const TILE_LAYOUTS = {
  // salas: [cx, cy] na grade 3×3 da peça · túneis internos: [i, j] · bordas: qual sala encosta em cada borda
  cruz: { rooms: [[1, 1], [1, 0], [2, 1], [1, 2], [0, 1]], tun: [[0, 1], [0, 2], [0, 3], [0, 4]], edge: { N: 1, E: 2, S: 3, W: 4 } },
  anel: { rooms: [[1, 0], [2, 1], [1, 2], [0, 1]], tun: [[0, 1], [1, 2], [2, 3], [3, 0]], edge: { N: 0, E: 1, S: 2, W: 3 } },
  tee: { rooms: [[0, 1], [1, 1], [2, 1], [1, 2]], tun: [[0, 1], [1, 2], [1, 3]], edge: { W: 0, E: 2, S: 3, N: 1 } },
  canto: { rooms: [[1, 0], [1, 1], [0, 1], [2, 2]], tun: [[0, 1], [1, 2], [1, 3]], edge: { N: 0, W: 2, E: 3, S: 3 } },
  reta: { rooms: [[1, 0], [1, 1], [1, 2]], tun: [[0, 1], [1, 2]], edge: { N: 0, S: 2, E: 1, W: 1 } },
  duas: { rooms: [[0, 1], [2, 1]], tun: [[0, 1]], edge: { W: 0, E: 1, N: 0, S: 1 } },
};
const T = (lay, k, t, e) => ({ lay, k, t, e });
export const START_TILE = T('cruz', ['boca', 'vazia', 'vazia', 'vazia', 'barracao'], ['t', 't', 't', 't'], { N: 't', E: 't', S: 't' });
export const TILES = {
  segura: [ // perto da Boca: quem fica soterrado aqui é resgatado. 5 peças, 4 entram
    T('tee', ['vazia', 'mascate', 'vazia', 'veio'], ['t', 't', 't'], { N: 't', E: 't', S: 't', W: 't' }),
    T('anel', ['deposito', 'vazia', 'capela', 'respiro'], ['t', 'dark', 't', 't'], { N: 't', E: 't', S: 'dark', W: 't' }),
    T('cruz', ['respiro', 'vazia', 'veio', 'vazia', 'eco'], ['t', 't', 'den', 't'], { N: 't', E: 't', S: 't', W: 'rail' }),
    T('reta', ['respiro', 'deposito', 'vazia'], ['t', 't'], { N: 't', S: 't', E: 't', W: 'dark' }),
    T('canto', ['capela', 'deposito', 'vazia', 'altar'], ['t', 'rail', 't'], { N: 't', W: 't', E: 't', S: 't' }),
  ],
  fundo: [ // 22 peças
    T('cruz', ['altar', 'geodo', 'vazia', 'eco', 'veio'], ['t', 'dark', 't', 'den'], { N: 't', E: 'dark', S: 't', W: 't' }),
    T('anel', ['geodo', 'altar', 'respiro', 'vazia'], ['dark', 't', 'den', 't'], { N: 't', E: 't', S: 't', W: 'dark' }),
    T('tee', ['vazia', 'altar', 'geodo', 'eco'], ['t', 'dark', 't'], { W: 't', E: 't', S: 'rub', N: 't' }),
    T('canto', ['veio', 'vazia', 'altar', 'geodo'], ['t', 'dden', 't'], { N: 't', W: 'dark', E: 't', S: 't' }),
    T('reta', ['eco', 'altar', 'deposito'], ['dark', 't'], { N: 't', S: 't', E: 't', W: 't' }),
    T('duas', ['geodo', 'altar'], ['den'], { W: 't', E: 't', N: 'dark', S: 't' }),
    T('cruz', ['mascate', 'vazia', 'altar', 'vazia', 'respiro'], ['t', 't', 't', 'dark'], { N: 't', E: 't', S: 't', W: 't' }),
    T('anel', ['altar', 'eco', 'geodo', 'capela'], ['t', 'ramp', 't', 'dark'], { N: 't', E: 't', S: 't', W: 't' }),
    T('tee', ['veio', 'eco', 'vazia', 'altar'], ['rail', 'rail', 't'], { W: 'rail', E: 'rail', S: 't', N: 't' }),
    T('canto', ['geodo', 'vazia', 'altar', 'respiro'], ['dark', 't', 'den'], { N: 't', W: 't', E: 'dark', S: 't' }),
    T('reta', ['vazia', 'geodo', 'altar'], ['t', 'dden'], { N: 't', S: 'dark', E: 't', W: 't' }),
    T('cruz', ['elevador', 'vazia', 'geodo', 'vazia', 'altar'], ['t', 't', 'dark', 't'], { N: 't', E: 't', S: 't', W: 't' }),
    T('anel', ['respiro', 'altar', 'vazia', 'geodo'], ['t', 't', 'dark', 'den'], { N: 'dark', E: 't', S: 't', W: 't' }),
    T('tee', ['eco', 'altar', 'veio', 'geodo'], ['t', 't', 'dark'], { W: 't', E: 't', S: 't', N: 'rub' }),
    T('duas', ['deposito', 'altar'], ['dark'], { W: 't', E: 't', N: 't', S: 't' }),
    T('canto', ['altar', 'geodo', 'veio', 'vazia'], ['ramp', 't', 't'], { N: 't', W: 't', E: 't', S: 'dark' }),
    T('reta', ['altar', 'eco', 'respiro'], ['den', 't'], { N: 't', S: 't', E: 'dark', W: 't' }),
    T('cruz', ['geodo', 'altar', 'eco', 'veio', 'vazia'], ['dark', 't', 't', 'den'], { N: 't', E: 't', S: 't', W: 'dark' }),
    T('anel', ['capela', 'geodo', 'altar', 'eco'], ['t', 'dark', 't', 't'], { N: 't', E: 't', S: 't', W: 't' }),
    T('tee', ['geodo', 'respiro', 'altar', 'vazia'], ['t', 'dden', 't'], { W: 'dark', E: 't', S: 't', N: 't' }),
    T('canto', ['vazia', 'eco', 'altar', 'geodo'], ['t', 't', 'dark'], { N: 't', W: 't', E: 't', S: 't' }),
    T('reta', ['veio', 'deposito', 'altar'], ['t', 't'], { N: 't', S: 't', E: 't', W: 'rub' }),
  ],
};
export const NINHO_TILE = T('cruz', ['ninho', 'geodo', 'vazia', 'altar', 'eco'], ['dark', 't', 't', 'dden'], { N: 't', E: 't', S: 't', W: 't' });
export const SAFE_TILES_USED = 4;
export const DEEP_FROM = 2; // Ninho e salas de chefe das DLCs entram entre a 3ª e a 9ª peça do Fundo
export const DEEP_TO = 8;
export const DLC_TILES = {
  cerbero: {
    lair: [T('cruz', ['covil', 'eco', 'vazia', 'geodo', 'vazia'], ['t', 'dark', 't', 't'], { N: 't', E: 't', S: 't', W: 't' })],
    extra: [T('tee', ['canil', 'vazia', 'altar', 'vazia'], ['t', 't', 'den'], { W: 't', E: 't', S: 't', N: 't' })],
  },
  medusa: {
    lair: [T('cruz', ['estatuas', 'eco', 'vazia', 'altar', 'vazia'], ['t', 't', 'dark', 't'], { N: 't', E: 't', S: 't', W: 't' })],
    extra: [T('anel', ['espelhos', 'vazia', 'geodo', 'vazia'], ['t', 'dark', 't', 't'], { N: 't', E: 't', S: 't', W: 't' }), T('reta', ['pedreira', 'vazia', 'altar'], ['t', 't'], { N: 't', S: 't', E: 't', W: 't' })],
  },
};
export const MAX_TILE_DIST = 5; // a mina cabe numa grade de 11×11 peças em volta da Boca
// Água no mapa explorado: alaga a partir das peças mais distantes da Boca (distância em peças)
export const WATER_GRACE = 2;

// ------------------------------------------------------------------ Relíquias que aparecem (mapa aleatório)
Object.assign(RELICS, {
  R08: { name: 'Moeda do Império', pts: 8, model: 'reliquia_moeda' },
  R12: { name: 'Pente de Tartaruga e Ouro', pts: 12, model: 'reliquia_pente' },
  R18: { name: 'Bússola de Ouro', pts: 18, model: 'reliquia_bussola' },
  R30b: { name: 'Ídolo da Serra', pts: 30, model: 'reliquia_idolo' },
  R09: { name: 'Colar de Contas de Ouro', pts: 9, model: 'reliquia_colar' },
  R16: { name: 'Candelabro de Prata', pts: 16, model: 'reliquia_candelabro' },
  R22: { name: 'Cálice de Esmeralda', pts: 22, model: 'reliquia_calice' },
  R27: { name: 'Máscara de Ouro', pts: 27, model: 'reliquia_mascara' },
});
// Pilhas de Relíquia pela distância da peça até a Boca (em peças), do menor para o maior valor.
// Cada Altar revelado pega a próxima da sua pilha; pilha vazia usa a de cima.
export const RELIC_TIERS = {
  rasa: ['R08', 'R09', 'R10', 'R12'],
  media: ['R15a', 'R15b', 'R16', 'R18'],
  funda: ['R20a', 'R20b', 'R22', 'R25', 'R27', 'R30b'],
};
export const tierOfDist = (d) => (d <= 1 ? 'rasa' : d <= 2 ? 'media' : 'funda');
export const DLC_RELIC_TIER = { R25c: 'funda', R20c: 'media' };
export const NINHO_RELIC = 'R30';
