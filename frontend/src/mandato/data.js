// MANDATO — dados do jogo, transcritos de MANDATO/02…07.
// Ops de efeito (interpretadas em engine.js):
//   gain{r,n} draw{n} appr{n} cube{n} adv{f,n} advChoice{n} merit{n} explore site{id}
//   choice{options} drawDiscard{draw,discard} desmate{free} off{kind,until} flag{k,v} cap{res,n} treasury{n}

export const RES = ['v', 'o', 'a'];

export const ZONES = {
  RES: { name: 'Residencial', color: '#E8C874' },
  COM: { name: 'Comercial', color: '#5E9CC4' },
  IND: { name: 'Industrial', color: '#C4533A' },
  INF: { name: 'Infraestrutura', color: '#1F6F78' },
  VER: { name: 'Verde/Lazer', color: '#8DAA7E' },
  SER: { name: 'Serviço', color: '#E07A6B' },
  MON: { name: 'Monumento', color: '#C9A227' },
};

export const FACTIONS = {
  tec: { name: 'Tecnocratas', icon: '🔧', color: '#1F6F78', style: 'Infraestrutura, universidades, planejamento', alliance: '+2 de capacidade de ⚡ e 💧; Edificações INF custam −🔨1 (mín. 1)' },
  ver: { name: 'Verdes', icon: '🌿', color: '#8DAA7E', style: 'Parques, reciclagem, ecologia', alliance: '−1 ☁️ total; Edificações VER custam −🔨1 (mín. 1)' },
  emp: { name: 'Empresários', icon: '💼', color: '#E0A526', style: 'Comércio, finanças, propaganda', alliance: '+💰1 no início do turno; Tesouro máximo +2' },
  sin: { name: 'Sindicatos', icon: '✊', color: '#C4533A', style: 'Indústria, obras, serviços sociais', alliance: '+🔨1 no início do turno; em cada Fiscalização, perde 1 😊 a menos (mín. 0)' },
};
export const FAC_KEYS = ['tec', 'ver', 'emp', 'sin'];

export const CARGOS = [
  { min: 0, name: 'Prefeito Novato', fx: '' },
  { min: 2, name: 'Prefeito Reeleito', fx: '' },
  { min: 4, name: 'Secretário Estadual', fx: '' },
  { min: 6, name: 'Deputado', fx: 'Olho do Partido: +1 🕵️ no Saco no fim de cada rodada' },
  { min: 8, name: 'Governador', fx: 'Alvo Nacional: Intrigas contra você custam −1 🗳️ para os outros' },
  { min: 10, name: 'Ministro do Partido', fx: 'Vitória (fim da rodada)' },
];

export const WATER_KINDS = ['O', 'R', 'A', 'C'];
export const TILE_NAMES = {
  '.': 'Plano', O: 'Orla', E: 'Encosta', J: 'Jazida', R: 'Rio', D: 'Duna', A: 'Oásis', F: 'Floresta', C: 'Costa',
};
export const TILE_HINT = {
  '.': 'Casa plana.', O: 'Orla (conta como casa de ÁGUA).', E: 'Encosta: construir custa +🔨1 (exceto INF hidro).',
  J: 'Jazida ✦.', R: 'Rio (conta como casa de ÁGUA).', D: 'Duna: construir custa +🔨1.',
  A: 'Oásis (casa de ÁGUA).', F: 'Floresta: para construir é preciso Desmatar (+🔨1 e +1 🕵️).', C: 'Costa (conta como casa de ÁGUA).',
};

// ------------------------------------------------------------------ helpers de definição

const g = (r, n) => ({ op: 'gain', r, n });
const draw = (n) => ({ op: 'draw', n });
const appr = (n) => ({ op: 'appr', n });
const cube = (n) => ({ op: 'cube', n });
const adv = (f, n = 1) => ({ op: 'adv', f, n });
const advAny = (n = 1) => ({ op: 'advChoice', n });
const flag = (k, v = 1) => ({ op: 'flag', k, v });
const site = (id) => ({ op: 'site', id });

export const CARDS = {};
const add = (c) => { CARDS[c.id] = { alert: false, fac: [], ...c }; return CARDS[c.id]; };

// ---- Deck básico (05)
[
  ['B-01', 'Orçamento Municipal', [g('v', 1)], '💰1'],
  ['B-02', 'Mão de Obra Local', [g('o', 1)], '🔨1'],
  ['B-03', 'Assessor Parlamentar', [g('a', 1)], '🗳️1'],
  ['B-04', 'Planejador Urbano', [draw(1), g('v', 1)], 'Compre 1 carta; 💰1'],
].forEach(([id, name, fx, t]) => add({ id, name, type: 'basic', cost: {}, fx, t }));
export const STARTER = [...Array(6).fill('B-01'), 'B-02', 'B-02', 'B-03', 'B-04'];

// ---- Deck padrão (06)
add({ id: 'P-01', name: 'Loteamento', type: 'building', std: true, lot: true, zones: ['RES'], cost: { v: 2 }, obra: 1, t: 'Edificação genérica. Ao construir, escolha a Zona: RES / COM / IND / INF.' });
add({ id: 'P-02', name: 'Licitação', type: 'standard', std: true, cost: { v: 3 }, fx: [g('o', 2)], t: '🔨2' });
add({ id: 'P-03', name: 'Explorar', type: 'standard', std: true, cost: { v: 3 }, fx: [{ op: 'explore' }], t: 'Revele 2 cartas do seu deck de Exploração, resolva 1 e ponha a outra no fundo.' });
add({ id: 'P-04', name: 'Lobby', type: 'standard', std: true, cost: { v: 3 }, fx: [g('a', 2)], t: '🗳️2' });
export const STANDARD = ['P-01', 'P-02', 'P-03', 'P-04'];
export const STD_QTY = { 'P-01': 12, 'P-02': 10, 'P-03': 10, 'P-04': 10 };

// Loteamento: stats por Zona escolhida (02 §6.4)
export const LOT_OPTS = {
  RES: { label: 'RES', zone: 'RES', obra: 1, pop: 2, cons: { e: 1, w: 1 }, t: '👥+2; Cons ⚡1💧1' },
  COM: { label: 'COM', zone: 'COM', obra: 1, inc: [{ r: 'v', n: 1 }], cons: { e: 1 }, req: 4, t: 'Renda 💰1; Cons ⚡1; Req 👥4' },
  IND: { label: 'IND', zone: 'IND', obra: 2, inc: [{ r: 'o', n: 2 }], poll: 1, cons: { e: 2 }, req: 6, t: 'Renda 🔨2; ☁️1; Cons ⚡2; Req 👥6' },
  INFe: { label: 'INF ⚡', zone: 'INF', obra: 2, power: { e: 2 }, poll: 1, t: '⚡+2 (☁️1)' },
  INFw: { label: 'INF 💧', zone: 'INF', obra: 2, power: { w: 2 }, t: '💧+2' },
};

// ---- Construções iniciais
add({ id: 'PREF', name: 'Prefeitura', type: 'building', zones: ['SER'], cost: {}, obra: 0, pop: 2, inc: [{ r: 'v', n: 1 }, { r: 'o', n: 1 }], fixed: true, t: 'Renda 💰1 🔨1; 👥+2 (base).' });
add({ id: 'HOME', name: 'Moradia Popular', type: 'building', zones: ['RES'], cost: {}, obra: 0, pop: 2, cons: { e: 1, w: 1 }, fixed: false, t: 'RES, 👥+2, Cons ⚡1💧1.' });

// ---- Edificações do Deck Especial (07 §2)
const bld = (id, name, zone, fac, aq, obra, x = {}) => add({
  id, name, type: 'building', tier: +id[1], zones: zone.split('+'), fac: fac ? [fac] : [], cost: { v: aq }, obra, ...x,
});

// Tier I
bld('E1-01', 'Conjunto Habitacional', 'RES', null, 3, 2, { cons: { e: 1, w: 1 }, pop: 4, onBuild: [{ op: 'appr', n: 1, ifAdj: 'SER' }], t: '👥+4. Ao construir adjacente a SER: +1 😊.' });
bld('E1-02', 'Mercadinho de Bairro', 'COM', 'emp', 3, 1, { cons: { e: 1 }, req: 4, inc: [{ r: 'v', n: 1 }, { r: 'v', n: 1, adj: 'RES', max: 2 }], t: 'Renda 💰1; +💰1 por RES adjacente (máx. +2).' });
bld('E1-03', 'Oficina Metalúrgica', 'IND', 'sin', 3, 2, { cons: { e: 1 }, req: 5, inc: [{ r: 'o', n: 2 }], poll: 1, t: 'Renda 🔨2; ☁️1.' });
bld('E1-04', 'Posto de Saúde', 'SER', 'sin', 3, 2, { cons: { e: 1, w: 1 }, onBuild: [appr(1)], endRound: 'posto', t: '+1 😊 ao construir. Fim de cada rodada: se 😊 ≤ 4, +1 😊.' });
bld('E1-05', 'Praça Arborizada', 'VER', 'ver', 2, 1, { poll: -1, popAdj: { zone: 'RES', n: 1, max: 2 }, t: '☁️ −1; RES adjacentes têm 👥+1 cada (máx. +2).' });
bld('E1-06', 'Painel Solar Comunitário', 'INF', 'tec', 3, 2, { power: { e: 3 }, solar: true, t: '⚡+3; ☁️0.' });
bld('E1-07', 'Estação de Tratamento', 'INF', 'tec', 3, 2, { cons: { e: 1 }, power: { w: 4 }, t: '💧+4.' });
bld('E1-08', 'Feira Livre', 'COM', null, 2, 1, { inc: [{ r: 'v', n: 1 }, { r: 'a', n: 1, adjAny: 'VER' }], t: 'Renda 💰1; se adjacente a VER, também 🗳️1.' });

// Tier II
bld('E2-01', 'Torre Residencial', 'RES', null, 5, 3, { cons: { e: 2, w: 2 }, pop: 7, upg: 'RES', t: '👥+7. Melhoria de RES.' });
bld('E2-02', 'Shopping Center', 'COM', 'emp', 5, 3, { cons: { e: 2 }, req: 8, inc: [{ r: 'v', n: 3 }, { r: 'v', n: 1, adj: 'RES', max: 2 }], upg: 'COM', t: 'Renda 💰3; +💰1 por RES adjacente (máx. +2). Melhoria de COM.' });
bld('E2-03', 'Siderúrgica', 'IND', 'sin', 5, 3, { cons: { e: 2 }, req: 8, inc: [{ r: 'o', n: 3 }, { r: 'v', n: 1 }], poll: 3, upg: 'IND', alert: true, t: 'Renda 🔨3 + 💰1; ☁️3. Melhoria de IND.' });
bld('E2-04', 'Usina a Gás', 'INF', 'tec', 4, 3, { power: { e: 5 }, poll: 2, alert: true, t: '⚡+5; ☁️2.' });
bld('E2-05', 'Hospital Municipal', 'SER', 'sin', 5, 3, { cons: { e: 2, w: 1 }, onBuild: [appr(2)], shield: 1, t: '+2 😊 ao construir. 1×/Fiscalização: reduza em 1 suas perdas de 😊.' });
bld('E2-06', 'Universidade Técnica', 'SER', 'tec', 5, 3, { cons: { e: 2 }, req: 6, inc: [{ r: 'a', n: 1 }], onBuild: [adv('tec', 1)], t: 'Renda 🗳️1; ao construir: +1 🔧.' });
bld('E2-07', 'Parque Linear', 'VER', 'ver', 4, 2, { poll: -2, popAdj: { zone: 'RES', n: 1, max: 2 }, onBuild: [appr(1)], t: '☁️ −2; RES adjacentes 👥+1 (máx. +2); +1 😊 ao construir.' });
bld('E2-08', 'Estação de Metrô', 'INF', 'tec', 5, 3, { cons: { e: 2 }, req: 6, reqMinus: { zones: ['COM', 'IND'], n: 2 }, t: 'Seus COM e IND têm Req 👥 −2.' });
bld('E2-09', 'Porto Comercial', 'COM', 'emp', 5, 3, { cons: { e: 1 }, req: 6, needWater: true, inc: [{ r: 'v', n: 3 }, { r: 'a', n: 1 }], poll: 1, t: 'Exige casa ÁGUA. Renda 💰3 + 🗳️1; ☁️1.' });

// Tier III
bld('E3-01', 'Arranha-Céu Misto', 'RES+COM', 'emp', 8, 4, { cons: { e: 3, w: 2 }, req: 8, pop: 8, inc: [{ r: 'v', n: 2 }], t: '👥+8; Renda 💰2.' });
bld('E3-02', 'Complexo Industrial', 'IND', 'sin', 8, 4, { cons: { e: 3, w: 2 }, req: 10, inc: [{ r: 'o', n: 4 }, { r: 'v', n: 2 }], poll: 4, alert: true, t: 'Renda 🔨4 + 💰2; ☁️4.' });
bld('E3-03', 'Usina Nuclear', 'INF', 'tec', 8, 4, { cons: { w: 1 }, power: { e: 9 }, onBuild: [cube(2)], alert: true, t: '⚡+9; ao construir, adicione 2 🕵️.' });
bld('E3-04', 'Centro de Convenções', 'COM', 'emp', 7, 3, { cons: { e: 2 }, req: 10, inc: [{ r: 'v', n: 3 }, { r: 'a', n: 1 }], t: 'Renda 💰3 + 🗳️1.' });
bld('E3-05', 'Aeroporto Internacional', 'INF', 'emp', 8, 4, { cons: { e: 3 }, req: 12, inc: [{ r: 'a', n: 2 }], poll: 2, wonderDiscount: 1, t: 'Renda 🗳️2; suas Obras-Prima custam −🔨1 (mín. 1); ☁️2.' });
bld('E3-06', 'Smart City Hub', 'INF', 'tec', 7, 3, { power: { e: 2, w: 2 }, hub: 3, t: '⚡+2 e 💧+2; cada outra INF sua rende +1 do mesmo recurso (máx. +3).' });
bld('E3-07', 'Usina de Reciclagem e Energia', 'INF+VER', 'ver', 7, 3, { power: { e: 3 }, poll: -2, recycle: true, t: '⚡+3; ☁️ −2; no seu turno, exile 1 carta da mão (grátis).' });

// ---- Administração e Aliados (07 §3)
const adm = (id, name, fac, cost, fx, t, x = {}) => add({ id, name, type: 'admin', tier: +id[1], fac: fac ? [fac] : [], cost, fx, t, ...x });
adm('A1-01', 'Chefe de Gabinete', null, { v: 3 }, [g('a', 1), draw(1)], '🗳️1; compre 1 carta.');
adm('A1-02', 'Engenheira Chefe', 'tec', { v: 3 }, [g('o', 2)], '🔨2.');
adm('A1-03', 'Fiscal de Obras', null, { v: 3 }, [g('o', 1), flag('freeDemolish')], '🔨1; você pode demolir 1 edifício sem custo.');
adm('A1-04', 'Assessora de Imprensa', 'emp', { v: 3 }, [g('a', 1), appr(1)], '🗳️1; +1 😊.');
adm('A1-05', 'Líder Sindical', 'sin', { v: 3 }, [g('o', 1), g('v', 1)], '🔨1; 💰1.');
adm('A1-06', 'Ecóloga Municipal', 'ver', { v: 3 }, [{ op: 'choice', options: [{ l: '+1 😊', ops: [appr(1)] }, { l: 'Remover 1 🕵️ seu do Saco', ops: [cube(-1)] }] }], 'Escolha: +1 😊 ou remova 1 🕵️ seu do Saco.');
adm('A1-07', 'Lobista', 'emp', { v: 3 }, [g('a', 2), cube(1)], '🗳️2; adicione 1 🕵️.', { alert: true, corrupt: true });
adm('A2-01', 'Urbanista Visionário', 'tec', { v: 5 }, [draw(2), g('o', 1)], 'Compre 2 cartas; 🔨1.');
adm('A2-02', 'Diretor Financeiro', 'emp', { v: 5 }, [g('v', 3), flag('treasuryBonus', 2)], '💰3; no fim deste turno, guarde +2 💰 além do limite do Tesouro.');
adm('A2-03', 'Secretária de Meio Ambiente', 'ver', { v: 5 }, [cube(-2), appr(1)], 'Remova até 2 🕵️ seus do Saco; +1 😊.');
adm('A2-04', 'Mestre de Obras', 'sin', { v: 5 }, [g('o', 3), flag('mestreObras')], '🔨3; se construir neste turno, ganhe 💰1 (1×).');
adm('A2-05', 'Consultor do Partido', null, { v: 5 }, [g('a', 3)], '🗳️3.');
adm('A2-06', 'Deputado Amigo', null, { v: 3, a: 1 }, [g('a', 2), advAny(1)], '🗳️2; avance 1 em uma Facção à sua escolha.', { alert: true });
adm('A2-07', 'Contabilidade Criativa', 'emp', { v: 4 }, [g('v', 4), cube(2)], '💰4; adicione 2 🕵️.', { alert: true, corrupt: true });
adm('A2-08', 'Empreiteira Amiga', 'sin', { v: 4 }, [g('o', 3), cube(1)], '🔨3; adicione 1 🕵️.', { alert: true, corrupt: true });
adm('A3-01', 'Governador Padrinho', null, { v: 8 }, [g('a', 3), g('v', 2), advAny(1)], '🗳️3 e 💰2; avance 1 em uma Facção.');
adm('A3-02', 'Czar do Planejamento', 'tec', { v: 7 }, [g('o', 3), g('v', 2), draw(2)], '🔨3 e 💰2; compre 2 cartas.');
adm('A3-03', 'Ministro de Obras', 'sin', { v: 8 }, [g('o', 4), flag('express')], '🔨4; Obra Expressa: construa 1 Edificação da Fila Especial pagando Aq e Ob (sem passar pelo deck).');
adm('A3-04', 'Mestre da Propaganda', 'emp', { v: 7 }, [appr(2), g('a', 2), cube(-2)], '+2 😊; 🗳️2; remova 2 🕵️ seus do Saco.');
adm('A3-05', 'Chefe da Casa Civil', null, { v: 8 }, [g('a', 4), draw(1)], '🗳️4; compre 1 carta.');

// ---- Decretos (07 §4)
const dec = (id, name, fac, aq, t, cost) => add({ id, name, type: 'decree', tier: +id[1], fac, cost: { v: aq }, t, penalty: cost });
dec('D1-01', 'Austeridade', ['emp'], 4, '+💰2 no início do turno.', 'Custo: 😊 máximo 7.');
dec('D1-02', 'Plano Verde', ['ver'], 4, 'Cada VER/INF limpa (☁️ ≤ 0) que construir: +1 😊.', 'Custo: IND custam +🔨1.');
dec('D2-01', 'Pacote de Estímulo', ['sin', 'emp'], 5, 'A 1ª Edificação construída por turno custa −🔨1 (mín. 0).', 'Custo: fim da rodada, se não construiu, −1 😊.');
dec('D2-02', 'Lei de Zoneamento', ['tec'], 5, 'No início do turno, por par de edifícios da mesma Zona adjacentes (RES/COM/IND, máx. 3 pares): RES→👥+1, COM→💰1, IND→🔨1.', '');
dec('D2-03', 'Reforma Tributária', ['emp'], 5, 'Início do turno: +💰1 por 5 👥 (máx. +3).', 'Custo: ao jogar, −2 😊.');
dec('D3-01', 'Estado de Emergência', ['sin', 'tec'], 7, '1×/turno: faça uma Demolição ou Melhoria com −2 🔨.', 'Custo: 😊 máximo 6.');

// ---- Intrigas (07 §5)
const intr = (id, name, a, t, alert = false) => add({ id, name, type: 'intrigue', tier: +id[1], cost: { a }, t, alert });
intr('I1-01', 'Denúncia Anônima', 3, 'O alvo coloca 2 🕵️ no Saco.', true);
intr('I1-02', 'Campanha de Boatos', 3, 'O alvo perde 2 😊.');
intr('I1-03', 'Embargo Comercial', 3, 'No próximo turno do alvo, ele tem −2 💰 no total.');
intr('I2-01', 'Greve Geral', 4, 'No próximo turno do alvo, ele tem −2 🔨 (mín. 0).', true);
intr('I2-02', 'Sabotagem de Obra', 4, '1 edifício do alvo fica inativo até o fim da próxima rodada.');
intr('I2-03', 'Contra-Inteligência', 3, 'Reação: cancele uma Intriga contra você; compre 1 carta.');
intr('I2-04', 'Pressão Parlamentar', 4, 'O líder de uma Facção recua 2; você avança 1 nela.');
intr('I3-01', 'Vazamento de Documentos', 5, 'O jogador com mais ⭐ coloca 3 🕵️ no Saco.', true);
intr('I3-02', 'Auditoria Surpresa', 5, 'Dispare uma Fiscalização imediata.', true);
intr('I3-03', 'Aliança Estratégica', 4, 'Você e um jogador escolhido avançam 1 em Facções diferentes, à escolha de cada um.');

export const SPECIAL_TIERS = [
  ['E1-01', 'E1-02', 'E1-03', 'E1-04', 'E1-05', 'E1-06', 'E1-07', 'E1-08', 'A1-01', 'A1-02', 'A1-03', 'A1-04', 'A1-05', 'A1-06', 'A1-07', 'D1-01', 'D1-02', 'I1-01', 'I1-02', 'I1-03'],
  ['E2-01', 'E2-02', 'E2-03', 'E2-04', 'E2-05', 'E2-06', 'E2-07', 'E2-08', 'E2-09', 'A2-01', 'A2-02', 'A2-03', 'A2-04', 'A2-05', 'A2-06', 'A2-07', 'A2-08', 'D2-01', 'D2-02', 'D2-03', 'I2-01', 'I2-02', 'I2-03', 'I2-04'],
  ['E3-01', 'E3-02', 'E3-03', 'E3-04', 'E3-05', 'E3-06', 'E3-07', 'A3-01', 'A3-02', 'A3-03', 'A3-04', 'A3-05', 'D3-01', 'I3-01', 'I3-02', 'I3-03'],
];

// ---- Obras-Prima (07 §6)
const wnd = (id, name, fac, cost, x) => add({
  id, name, type: 'wonder', zones: ['MON'], fac: fac ? [fac] : [], cost, obra: cost.o, wonder: true, merit: 2, ...x,
});
wnd('M-01', 'Estádio Olímpico', null, { v: 6, o: 5, a: 2 }, { buildReq: { pop: 10 }, cons: { e: 3 }, onBuild: [appr(2)], t: 'Req 👥10. +2 😊; Cons ⚡3.' });
wnd('M-02', 'Ponte Estaiada', 'tec', { v: 6, o: 5 }, { needWater: true, inc: [{ r: 'v', n: 2 }], t: 'Casa ÁGUA. Renda 💰2.' });
wnd('M-03', 'Jardim Botânico', 'ver', { v: 5, o: 4, a: 1 }, { poll: -3, onBuild: [appr(1)], t: '☁️ −3; +1 😊.' });
wnd('M-04', 'Torre de Telecomunicações', 'tec', { v: 6, o: 4, a: 2 }, { cons: { e: 2 }, inc: [{ r: 'a', n: 2 }], t: 'Renda 🗳️2; Cons ⚡2.' });
wnd('M-05', 'Hidrelétrica Monumental', 'tec', { v: 7, o: 5 }, { hydro: true, tileAny: ['water', 'E'], power: { e: 8 }, t: 'Casa ÁGUA ou Encosta. ⚡+8; ☁️0.' });
wnd('M-06', 'Grande Biblioteca', null, { v: 5, o: 4, a: 3 }, { bigLib: true, t: 'Você compra +1 carta no fim do turno (6 em vez de 5).' });
wnd('M-07', 'Distrito Financeiro', 'emp', { v: 8, o: 4, a: 2 }, { buildReq: { pop: 14 }, inc: [{ r: 'v', n: 4 }], t: 'Req 👥14. Renda 💰4.' });
wnd('M-08', 'Terminal Intercontinental', 'emp', { v: 7, o: 5, a: 2 }, { buildReq: { pop: 12 }, inc: [{ r: 'a', n: 2 }, { r: 'v', n: 2 }], t: 'Req 👥12. Renda 🗳️2 + 💰2.' });
wnd('M-09', 'Memorial do Partido', null, { v: 4, o: 3, a: 4 }, { inc: [{ r: 'a', n: 1 }], onBuild: [{ op: 'advTwo' }], t: 'Ao construir: avance 1 em duas Facções diferentes; Renda 🗳️1.' });
wnd('M-10', 'Eco-Distrito Modelo', 'ver', { v: 7, o: 5, a: 2 }, { buildReq: { ver: 3 }, onBuild: [appr(3)], poll: -2, t: '≥3 VER construídos. +3 😊; ☁️ −2.' });
wnd('M-11', 'Smart Grid Central', 'tec', { v: 6, o: 4, a: 3 }, { power: { e: 4, w: 4 }, t: '⚡+4 e 💧+4.' });
wnd('M-12', 'Parque Industrial Modelo', 'sin', { v: 7, o: 5, a: 1 }, { inc: [{ r: 'o', n: 3 }, { r: 'v', n: 2 }], poll: 2, t: 'Renda 🔨3 + 💰2; ☁️2.' });
export const WONDERS = Object.keys(CARDS).filter((k) => k.startsWith('M-'));

// ------------------------------------------------------------------ Metas (03 §4)

export const GOALS = [
  { id: 'G-01', name: 'Polo Comercial', cat: 'Economia', t: '3 COM construídos e Renda 💰 total ≥ 5 por turno.', d: 2 },
  { id: 'G-02', name: 'Cinturão Industrial', cat: 'Economia', t: '3 IND e Renda 🔨 total ≥ 6 por turno.', d: 2 },
  { id: 'G-03', name: 'Cofres Cheios', cat: 'Economia', t: 'Tesouro no máximo no início do turno.', d: 1 },
  { id: 'G-04', name: 'Metrópole', cat: 'População', t: '👥 ≥ 20.', d: 2 },
  { id: 'G-05', name: 'Bairro Planejado', cat: 'População', t: '4 RES formando um quadrado 2×2.', d: 2 },
  { id: 'G-06', name: 'Distrito Verde', cat: 'Ambiente', t: '3 VER e ☁️ ≤ 0.', d: 2 },
  { id: 'G-07', name: 'Autossuficiência', cat: 'Infra', t: 'Excedente de ⚡ ≥ 3 e de 💧 ≥ 3.', d: 2 },
  { id: 'G-08', name: 'Cidade Limpa', cat: 'Ambiente', t: '☁️ ≤ 2 com 👥 ≥ 12.', d: 3 },
  { id: 'G-09', name: 'Povo Feliz', cat: 'Ambiente', t: '😊 = 10.', d: 3 },
  { id: 'G-10', name: 'Rede Completa', cat: 'Infra', t: '1 edifício de cada Zona: RES, COM, IND, INF, VER, SER.', d: 2 },
  { id: 'G-11', name: 'Mãos Limpas', cat: 'Político', t: '0 cubos 🕵️ seus no Saco e ≥ 8 edifícios.', d: 2 },
  { id: 'G-12', name: 'Articulador', cat: 'Político', t: '≥ 2 em todas as 4 Facções.', d: 3 },
  { id: 'G-13', name: 'Líder de Bancada', cat: 'Político', t: 'Único mais alto em 2 Facções.', d: 3 },
  { id: 'G-14', name: 'Gabinete Completo', cat: 'Político', t: '2 Decretos no Gabinete.', d: 1 },
  { id: 'G-15', name: 'Canteiro de Obras', cat: 'Construção', t: 'Construir 3 edifícios no mesmo turno.', d: 2 },
  { id: 'G-16', name: 'Grande Planejador', cat: 'Construção', t: '12 edifícios na grade (inclui Prefeitura).', d: 3 },
  { id: 'G-17', name: 'Explorador', cat: 'Exploração', t: 'Ter resolvido 6 cartas de Exploração.', d: 2 },
  { id: 'G-18', name: 'Sobrevivente', cat: 'Resiliência', t: 'Passar por 3 Fiscalizações seguidas sem tomar nenhum cubo.', d: 2 },
];

// ------------------------------------------------------------------ Deck de Rodada (03 §5)
// metric: chave de ranking usada pela Auditoria; low = "menor é melhor"

export const ROUNDS = [
  { id: 'RD-01', name: 'Boom Imobiliário', ev: 'Quem tem 👥 ≥ 6 ganha 💰2 no Tesouro.', au: 'Maior 👥', metric: 'pop' },
  { id: 'RD-02', name: 'Temporada de Chuvas', ev: 'Litoral/Ilha: 1 edifício em Orla/Costa fica inativo na rodada. Deserto: +💧2 de capacidade.', au: 'Maior 😊', metric: 'appr' },
  { id: 'RD-03', name: 'Onda de Calor', ev: 'Deserto/Planície: 💧 −3 de capacidade. Floresta: −1 😊.', au: 'Maior excedente de 💧', metric: 'sw' },
  { id: 'RD-04', name: 'Greve de Transportes', ev: 'Licitação custa +💰1 na rodada.', au: 'Menor ☁️ (desempate: maior 👥)', metric: 'poll', low: true },
  { id: 'RD-05', name: 'Feriado Nacional', ev: 'Todos +1 😊.', au: 'Mais edifícios na grade', metric: 'bld' },
  { id: 'RD-06', name: 'Crise Energética', ev: '⚡ −2 de capacidade para todos (Deserto solar: imune).', au: 'Maior excedente de ⚡', metric: 'se' },
  { id: 'RD-07', name: 'Visita do Ministro', ev: 'Quem tem menos ⭐ (empatados incluídos) avança 1 em uma Facção à escolha.', au: 'Maior soma de Facções', metric: 'facs' },
  { id: 'RD-08', name: 'Abalo Sísmico', ev: 'Montanha: 1 edifício inativo na rodada. Todos: descarte as 2 cartas mais antigas da Fila Especial e reponha.', au: 'Maior Tesouro', metric: 'treasury' },
  { id: 'RD-09', name: 'Escândalo Nacional', ev: 'Fiscalização imediata com Tensão +1.', au: 'Menos 🕵️ seus no Saco', metric: 'cubes', low: true },
  { id: 'RD-10', name: 'Feira Internacional', ev: 'COM geram +💰1 na rodada (+2 para Litoral/Ilha em Orla).', au: 'Maior Renda 💰', metric: 'incv' },
  { id: 'RD-11', name: 'Sinal Verde do Partido', ev: 'Cada VER seu dá +1 😊 (máx. +3).', au: 'Mais VER', metric: 'ver' },
  { id: 'RD-12', name: 'Corte Orçamentário', ev: 'Tesouro máximo = 1 neste fim de rodada.', au: 'Maior Renda 🔨', metric: 'inco' },
];

// ------------------------------------------------------------------ Terrenos (04)

const rows = (a, b, c, d) => [...a, ...b, ...c, ...d];
const islandTiles = () => {
  const t = [];
  // Ilha principal: 3 colunas × 3 linhas, sem C3
  ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3'].forEach((n) => t.push({ k: 'C', isl: 'M', x: 'ABC'.indexOf(n[0]), y: +n[1] - 1 }));
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([x, y]) => t.push({ k: 'C', isl: 'N', x, y }));
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([x, y]) => t.push({ k: 'C', isl: 'L', x, y }));
  return t;
};

export const TERRAINS = {
  litoral: {
    id: 'litoral', name: 'Litoral', sub: 'Costa Dourada', icon: '🌊', color: '#5E9CC4', cap: { e: 3, w: 3 },
    grid: rows('OOOO', '.PH.', '....', '....'),
    trait: 'Turismo Sazonal', traitT: 'Cada COM ou VER em Orla rende +💰1. Cada VER em Orla tem ☁️ −1 adicional.',
    weak: 'Maré Alta', weakT: 'Quando você sofrer ≥1 hit de Fiscalização, 1 edifício em Orla fica inativo até seu próximo turno (1×/rodada).',
    style: 'Economia de turismo e comércio; Verde costeiro.', stars: { eco: 4, con: 3, inf: 3 }, risk: 'Média', cx: 'Baixa',
    regionalGoal: { id: 'RG-LIT', name: 'Cartão-Postal', t: '3 COM/VER na Orla e 😊 ≥ 7.' },
    regional: ['R-LIT-1', 'R-LIT-2', 'R-LIT-3'],
  },
  montanha: {
    id: 'montanha', name: 'Montanha', sub: 'Serra Alta', icon: '⛰️', color: '#6C7A89', cap: { e: 3, w: 3 },
    grid: rows('EEEE', 'EPH.', '..JR', '.J..'),
    trait: 'Riqueza Mineral', traitT: 'Jazidas (J) aceitam a Mina de Cobre. Hidrelétricas em Rio/Encosta custam −🔨1.',
    weak: 'Encostas', weakT: '5 casas Encosta (+🔨1 para construir). Poucas casas planas.',
    style: 'Indústria pesada, energia barata, construção cara.', stars: { eco: 3, con: 2, inf: 4 }, risk: 'Alta (Minas)', cx: 'Média',
    regionalGoal: { id: 'RG-MON', name: 'Veia Metálica', t: '2 IND ativos em Jazida e ☁️ ≤ 4.' },
    regional: ['R-MON-1', 'R-MON-2', 'R-MON-3'],
  },
  planicie: {
    id: 'planicie', name: 'Planície', sub: 'Campos Verdes', icon: '🌾', color: '#B5C66E', cap: { e: 3, w: 4 },
    grid: rows('....', '.PHR', '...R', '....'),
    trait: 'Terra Barata', traitT: 'Loteamento custa 💰1 e −🔨1 para construir; Licitação e Explorar custam 💰2. Cada RES vizinho de um VER rende +💰1 (bairro-jardim).',
    weak: 'Poucas Riquezas', weakT: 'Nenhuma casa especial além do Rio; Seca (Onda de Calor) corta −3 de 💧.',
    style: 'Expansão rápida e barata; precisa de Infra cedo.', stars: { eco: 3, con: 4, inf: 2 }, risk: 'Baixa', cx: 'Baixa',
    regionalGoal: { id: 'RG-PLA', name: 'Cidade Jardim', t: '👥 ≥ 12, 😊 ≥ 7 e ☁️ ≤ 3.' },
    regional: ['R-PLA-1', 'R-PLA-2', 'R-PLA-3'],
  },
  deserto: {
    id: 'deserto', name: 'Deserto', sub: 'Mesa Árida', icon: '🏜️', color: '#D98A3D', cap: { e: 3, w: 1 },
    grid: rows('....', 'DPHD', 'D.A.', 'D.D.'),
    trait: 'Sol Pleno', traitT: 'Seus INF de ⚡ solar têm +1 ⚡ e ☁️0. O Loteamento INF para ⚡ rende ⚡+3 (sem ☁️).',
    weak: 'Sede', weakT: '💧 inicial 1. 5 Dunas (+🔨1). Onda de Calor corta mais 💧.',
    style: 'Energia solar abundante, água como gargalo.', stars: { eco: 3, con: 3, inf: 2 }, risk: 'Média', cx: 'Média',
    regionalGoal: { id: 'RG-DES', name: 'Oásis de Ouro', t: 'Ter construído o Poço do Oásis e ter excedente ≥ 4 de ⚡ e de 💧.' },
    regional: ['R-DES-1', 'R-DES-2', 'R-DES-3'],
  },
  floresta: {
    id: 'floresta', name: 'Floresta', sub: 'Mata Fechada', icon: '🌲', color: '#3E6B4B', cap: { e: 3, w: 3 },
    grid: rows('FF..', 'FPH.', '...F', '..FF'),
    trait: 'Pulmão Verde', traitT: 'A cada 2 Florestas intactas: ☁️ −1 (máx. −3). VER ou COM adjacente a Floresta intacta rende +💰1 (Ecoturismo).',
    weak: 'Mata Fechada', weakT: '6 casas Floresta. Desmatar: pague +🔨1 antes de construir. A casa deixa de ser Floresta intacta.',
    style: 'Ecoturismo, Verde, mas expansão difícil.', stars: { eco: 2, con: 2, inf: 3 }, risk: 'Média', cx: 'Alta',
    regionalGoal: { id: 'RG-FLO', name: 'Guardiões', t: '≥ 4 Florestas intactas no fim do turno e 👥 ≥ 10.' },
    regional: ['R-FLO-1', 'R-FLO-2', 'R-FLO-3'],
  },
  ilha: {
    id: 'ilha', name: 'Ilha', sub: 'Arquipélago', icon: '🏝️', color: '#2BB3A3', cap: { e: 3, w: 3 }, island: true,
    tiles: islandTiles(),
    trait: 'Rota Marítima', traitT: '1×/turno: troque 💰2 → 🗳️1 ou 🗳️1 → 💰2. COM em Costa não rende extra, mas Porto Comercial custa −🔨1.',
    weak: 'Arquipélago', weakT: 'Adjacência só dentro da ilha. IND fora da Ilha Principal custa +🔨1 (logística por barco).',
    style: 'Turismo de luxo, conversão de recursos, logística.', stars: { eco: 3, con: 2, inf: 2 }, risk: 'Baixa', cx: 'Alta',
    regionalGoal: { id: 'RG-ILH', name: 'Arquipélago Conectado', t: 'Balsas ligando as 3 ilhas e Renda 💰 total ≥ 6.' },
    regional: ['R-ILH-1', 'R-ILH-2', 'R-ILH-3'],
  },
};
export const TERRAIN_IDS = Object.keys(TERRAINS);

// Cartas regionais (04)
const reg = (id, name, zone, obra, x) => add({ id, name, type: 'building', regional: true, zones: zone.split('+'), cost: {}, obra, ...x });
reg('R-LIT-1', 'Porto Pesqueiro', 'COM', 2, { onlyOn: ['O'], cons: { e: 1 }, inc: [{ r: 'v', n: 2 }, { r: 'v', n: 1, adj: 'COM', max: 2 }], t: 'Em Orla. Renda 💰2; +💰1 por COM adjacente (máx. +2).' });
reg('R-LIT-2', 'Farol Histórico', 'VER', 1, { onlyOn: ['O'], poll: -1, onBuild: [appr(1)], inc: [{ r: 'a', n: 1 }], t: 'Em Orla. ☁️ −1; +1 😊 ao construir; Renda 🗳️1.' });
reg('R-LIT-3', 'Resort Litorâneo', 'COM', 3, { onlyOn: ['O'], cons: { e: 2, w: 2 }, req: 6, inc: [{ r: 'v', n: 2 }, { r: 'a', n: 1 }], t: 'Em Orla. Req 👥6; Renda 💰2 + 🗳️1.' });
reg('R-MON-1', 'Mina de Cobre', 'IND', 3, { onlyOn: ['J'], cons: { e: 1 }, req: 4, inc: [{ r: 'o', n: 1 }, { r: 'v', n: 2 }], poll: 2, mine: true, t: 'Em Jazida. Req 👥4; Renda 🔨1 + 💰2; ☁️2. Se um cubo seu for sorteado, a Mina fica inativa até seu próximo turno.' });
reg('R-MON-2', 'Pequena Hidrelétrica', 'INF', 3, { onlyOn: ['R', 'E'], hydro: true, power: { e: 3 }, t: 'Em Rio/Encosta. ⚡+3; ☁️0.' });
reg('R-MON-3', 'Teleférico Turístico', 'COM', 2, { cons: { e: 1 }, req: 5, inc: [{ r: 'v', n: 2 }, { r: 'a', n: 1, onKind: 'E' }], t: 'Req 👥5; Renda 💰2; +🗳️1 se em Encosta.' });
reg('R-PLA-1', 'Silo Cooperativo', 'COM', 1, { inc: [{ r: 'v', n: 2 }, { r: 'v', n: 1, adjAny: 'VER' }], t: 'Renda 💰2; +💰1 se adjacente a VER.' });
reg('R-PLA-2', 'Cooperativa Agrícola', 'SER', 2, { cons: { e: 1 }, onBuild: [appr(1)], inc: [{ r: 'v', n: 2 }], t: '+1 😊 ao construir; Renda 💰2.' });
reg('R-PLA-3', 'Moinho Eólico', 'INF', 2, { power: { e: 4 }, t: '⚡+4; ☁️0.' });
reg('R-DES-1', 'Poço do Oásis', 'INF', 2, { onlyOn: ['A'], power: { w: 5 }, onBuild: [appr(1)], inc: [{ r: 'a', n: 1 }], t: 'Na casa Oásis. 💧+5; ☁️0; +1 😊 ao construir; Renda 🗳️1.' });
reg('R-DES-2', 'Fazenda Solar', 'INF', 2, { power: { e: 5 }, solar: true, t: '⚡+5; ☁️0.' });
reg('R-DES-3', 'Poço de Petróleo', 'IND', 2, { cons: { e: 1 }, req: 4, inc: [{ r: 'v', n: 3 }, { r: 'o', n: 1 }], poll: 3, onBuild: [cube(1)], t: 'Req 👥4; Renda 💰3 + 🔨1; ☁️3; ao construir, adicione 1 🕵️.' });
reg('R-FLO-1', 'Pousada Ecológica', 'COM+VER', 2, { cons: { w: 1 }, inc: [{ r: 'v', n: 1 }, { r: 'a', n: 1 }], t: 'Cons 💧1; Renda 💰1 + 🗳️1.' });
reg('R-FLO-2', 'Estação de Pesquisa', 'SER', 2, { cons: { e: 1 }, inc: [{ r: 'a', n: 1 }], onBuild: [adv('ver', 1)], t: 'Renda 🗳️1; +1 🌿 ao construir.' });
reg('R-FLO-3', 'Santuário', 'VER', 2, { poll: -2, onBuild: [appr(2)], forestOk: true, t: '☁️ −2; +2 😊 ao construir; pode ser construído em Floresta sem Desmatar (a casa conta como intacta).' });
reg('R-ILH-1', 'Resort Insular', 'COM', 3, { cons: { e: 1, w: 2 }, req: 5, inc: [{ r: 'v', n: 3 }, { r: 'a', n: 1, minorIsland: true }], t: 'Req 👥5; Renda 💰3; +🗳️1 se em ilha menor.' });
reg('R-ILH-2', 'Balsa Rápida', 'INF', 2, { ferry: true, t: 'Conecta duas ilhas: a adjacência vale entre as ilhas ligadas por ela.' });
reg('R-ILH-3', 'Estaleiro', 'IND', 3, { cons: { e: 2 }, req: 6, inc: [{ r: 'o', n: 2 }, { r: 'v', n: 1 }], poll: 2, t: 'Req 👥6; Renda 🔨2 + 💰1; ☁️2.' });

// Decks de Exploração (04): { id, name, type, ops }
const ex = (id, name, type, ops) => ({ id, name, type, ops });
export const EXPLORE = {
  litoral: [
    ex('X-LIT-01', 'Cardume Farto', 'Achado', [g('v', 3), { op: 'appr', n: 1, ifTile: 'comOrla' }]),
    ex('X-LIT-02', 'Porto Pesqueiro', 'Sítio', [site('R-LIT-1')]),
    ex('X-LIT-03', 'Farol Histórico', 'Sítio', [site('R-LIT-2')]),
    ex('X-LIT-04', 'Resort de Luxo', 'Sítio', [site('R-LIT-3')]),
    ex('X-LIT-05', 'Mar Calmo', 'Achado', [g('o', 2), g('a', 1)]),
    ex('X-LIT-06', 'Tempestade no Horizonte', 'Risco', [g('v', 4), { op: 'off', kind: 'O', until: 'round' }]),
    ex('X-LIT-07', 'Pescadores Sindicalizados', 'Encontro', [adv('sin', 1), g('o', 1)]),
    ex('X-LIT-08', 'Petróleo Offshore', 'Risco', [g('o', 3), g('v', 2), cube(2)]),
    ex('X-LIT-09', 'Turistas!', 'Achado', [g('a', 2), appr(1)]),
    ex('X-LIT-10', 'Ruínas Submersas', 'Achado', [draw(2)]),
  ],
  montanha: [
    ex('X-MON-01', 'Veio de Ferro', 'Achado', [g('o', 3)]),
    ex('X-MON-02', 'Mina de Cobre', 'Sítio', [site('R-MON-1')]),
    ex('X-MON-03', 'Barragem Natural', 'Sítio', [site('R-MON-2')]),
    ex('X-MON-04', 'Mirante Panorâmico', 'Sítio', [site('R-MON-3')]),
    ex('X-MON-05', 'Avalanche', 'Risco', [g('v', 4), { op: 'off', kind: 'E', until: 'turn' }]),
    ex('X-MON-06', 'Mineiros em Greve', 'Encontro', [adv('sin', 1), g('o', 2)]),
    ex('X-MON-07', 'Gruta de Cristais', 'Achado', [g('v', 2), g('a', 2)]),
    ex('X-MON-08', 'Pedreira Antiga', 'Achado', [flag('encostaDisc', 2)]),
    ex('X-MON-09', 'Velho Túnel', 'Achado', [draw(2)]),
    ex('X-MON-10', 'Geólogo Corrupto', 'Risco', [g('o', 3), g('v', 3), cube(2)]),
  ],
  planicie: [
    ex('X-PLA-01', 'Safra Recorde', 'Achado', [g('v', 4)]),
    ex('X-PLA-02', 'Silos Comunitários', 'Sítio', [site('R-PLA-1')]),
    ex('X-PLA-03', 'Cooperativa Agrícola', 'Sítio', [site('R-PLA-2')]),
    ex('X-PLA-04', 'Moinho Eólico', 'Sítio', [site('R-PLA-3')]),
    ex('X-PLA-05', 'Mão de Obra Sazonal', 'Achado', [g('o', 3)]),
    ex('X-PLA-06', 'Feira Regional', 'Achado', [g('v', 2), g('a', 1), appr(1)]),
    ex('X-PLA-07', 'Praga nas Lavouras', 'Risco', [g('a', 3), appr(-1)]),
    ex('X-PLA-08', 'Terreno Barato', 'Achado', [flag('firstBuildDisc', 2)]),
    ex('X-PLA-09', 'Agronegócio Amigo', 'Encontro', [adv('emp', 2), g('v', 2)]),
    ex('X-PLA-10', 'Êxodo Rural', 'Achado', [flag('nextResPop', 3)]),
  ],
  deserto: [
    ex('X-DES-01', 'Oásis Escondido', 'Sítio', [site('R-DES-1')]),
    ex('X-DES-02', 'Campo Solar', 'Sítio', [site('R-DES-2')]),
    ex('X-DES-03', 'Poço de Petróleo', 'Sítio', [site('R-DES-3')]),
    ex('X-DES-04', 'Caravana de Mercadores', 'Achado', [g('v', 3), g('a', 1)]),
    ex('X-DES-05', 'Tempestade de Areia', 'Risco', [g('o', 4), { op: 'next', k: 'capE', v: -2 }]),
    ex('X-DES-06', 'Ruínas Antigas', 'Achado', [draw(2), appr(1)]),
    ex('X-DES-07', 'Aquífero Subterrâneo', 'Achado', [{ op: 'cap', res: 'w', n: 1 }]),
    ex('X-DES-08', 'Nômades', 'Encontro', [adv('sin', 2), g('o', 1)]),
    ex('X-DES-09', 'Miragem', 'Risco', [{ op: 'drawDiscard', draw: 3, discard: 1 }]),
    ex('X-DES-10', 'Lítio!', 'Achado', [g('v', 4), adv('tec', 1)]),
  ],
  floresta: [
    ex('X-FLO-01', 'Clareira Fértil', 'Achado', [{ op: 'desmate' }]),
    ex('X-FLO-02', 'Reserva Aliada', 'Encontro', [adv('ver', 2), appr(1)]),
    ex('X-FLO-03', 'Pousada Ecológica', 'Sítio', [site('R-FLO-1')]),
    ex('X-FLO-04', 'Estação de Pesquisa', 'Sítio', [site('R-FLO-2')]),
    ex('X-FLO-05', 'Madeira Nobre', 'Risco', [g('v', 5), cube(1)]),
    ex('X-FLO-06', 'Rio Cristalino', 'Achado', [{ op: 'cap', res: 'w', n: 1 }, appr(1)]),
    ex('X-FLO-07', 'Bioma Raro', 'Sítio', [site('R-FLO-3')]),
    ex('X-FLO-08', 'Madeireiros', 'Risco', [g('o', 3), g('v', 2), { op: 'desmate', forced: true }, cube(1)]),
    ex('X-FLO-09', 'Extrativistas', 'Achado', [g('o', 2), g('v', 2)]),
    ex('X-FLO-10', 'Neblina Matinal', 'Achado', [draw(2), cube(-1)]),
  ],
  ilha: [
    ex('X-ILH-01', 'Recife de Corais', 'Achado', [g('v', 3), appr(1)]),
    ex('X-ILH-02', 'Resort Insular', 'Sítio', [site('R-ILH-1')]),
    ex('X-ILH-03', 'Balsa Rápida', 'Sítio', [site('R-ILH-2')]),
    ex('X-ILH-04', 'Estaleiro', 'Sítio', [site('R-ILH-3')]),
    ex('X-ILH-05', 'Contrabando', 'Risco', [g('v', 5), cube(2)]),
    ex('X-ILH-06', 'Turistas Estrangeiros', 'Achado', [g('a', 3)]),
    ex('X-ILH-07', 'Pescadores Locais', 'Encontro', [adv('sin', 1), adv('ver', 1)]),
    ex('X-ILH-08', 'Furacão', 'Risco', [g('o', 4), g('v', 2), { op: 'off', kind: 'any', until: 'turn' }]),
    ex('X-ILH-09', 'Cabo Submarino', 'Achado', [draw(2), g('a', 1)]),
    ex('X-ILH-10', 'Porto Livre', 'Achado', [flag('rotaTwice')]),
  ],
};

// ------------------------------------------------------------------ setup (08 / 03 §6)

export const SETUP = {
  // nº de jogadores → [metas visíveis, obras visíveis, neutros no Saco]
  1: [4, 3, 6], 2: [4, 3, 6], 3: [5, 3, 7], 4: [5, 3, 8], 5: [6, 4, 9], 6: [6, 4, 10],
};
export const PACKAGES = [
  {},
  { treasury: 1 },
  { treasury: 2 },
  { treasury: 2, appr: 1 },
  { treasury: 3 },
  { treasury: 3, appr: 1 },
];
// Pacote de Posição calibrado por nº de jogadores (simulação com draft por preferência; ver README)
export const PACKAGES_BY_N = {
  2: [{}, { treasury: 2 }],
  3: [{}, { treasury: 3 }, { treasury: 2 }],
  4: [{}, { treasury: 2 }, { treasury: 1 }, { treasury: 1 }],
  5: [{}, { treasury: 1 }, { treasury: 2 }, {}, {}],
  6: [{}, { treasury: 2 }, { treasury: 2 }, {}, {}, { treasury: 1 }],
};
export const packageFor = (n, seat) => ((PACKAGES_BY_N[n] || PACKAGES)[seat] || {});

export const RIVAL = {
  aprendiz: { name: 'Aprendiz', t: '+1 ⭐ nas rodadas pares (2, 4, 6…). Praticamente nunca chega a ⭐10.', ref: 4 },
  normal: { name: 'Normal', t: '+1 ⭐ por rodada, exceto nas rodadas 1 e 2. Chega a ⭐10 por volta da rodada 12.', ref: 4 },
  veterano: { name: 'Veterano', t: '+1 ⭐ por rodada; +1 extra nas rodadas 5, 8 e 11. Chega a ⭐10 por volta da rodada 10.', ref: 6 },
  mestre: { name: 'Mestre', t: '+1 ⭐ por rodada; +2 nas rodadas 4, 7 e 10. Chega a ⭐10 por volta da rodada 8.', ref: 8 },
};
export function rivalGain(level, r) {
  if (level === 'aprendiz') return r % 2 === 0 ? 1 : 0;
  if (level === 'normal') return r > 2 ? 1 : 0;
  if (level === 'veterano') return 1 + ([5, 8, 11].includes(r) ? 1 : 0);
  return 1 + ([4, 7, 10].includes(r) ? 1 : 0);
}

export const PLAYER_COLORS = ['#C4533A', '#1F6F78', '#E0A526', '#6B3F69', '#5E9CC4', '#8DAA7E'];
