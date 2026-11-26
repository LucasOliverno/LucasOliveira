// Textos da interface do GARIMPO, gerados a partir dos dados (as regras ficam só em data.js).
import { CARDS, RELICS, MASCATE, ROOMS } from '../data.js';

const BASE = import.meta.env?.BASE_URL || '/';
export const art = (id) => `${BASE}garimpo/cards/${id}.webp`;
export const icon = (id) => `${BASE}garimpo/icons/${id}.webp`;
export const asset = (name) => `${BASE}garimpo/${name}`;
const HAS_ART = new Set([
  'LAMP', 'BARG', 'PICG', 'TROP', 'QUER', 'CABO', 'MAPV', 'RATO', 'CARB', 'ACO', 'SISAL', 'CAPA', 'DINA', 'BPRA', 'DETE', 'CARR', 'MAPG',
  'TIAO', 'ZEFA', 'MASC', 'FERR', 'MOLE', 'CANT', 'CAPT', 'BENZ', 'CONT', 'MORC', 'ARAN', 'COBR', 'LOBI', 'BOIT', 'CSEC', 'GRIS', 'INFI', 'RACH',
  'PEPE', 'FOSS', 'DIAR', 'TOLO', 'BOLO', 'LIRA', 'OSSO', 'UIVO', 'ESPE', 'ESCU', 'OLHA', 'PEDR', 'R10', 'R15a', 'R15b', 'R20a', 'R20b', 'R25', 'R30',
]);
export const hasArt = (id) => HAS_ART.has(id);

const FX = {
  ropeUp: 'neste turno, subir escada custa 🔦1',
  dyn: 'pode remover um Desabamento',
  detector: 'no Veio Profundo, +💠1',
  freeRide: 'ande até 3 nós de trilho de graça',
  darkCheap: 'túneis escuros custam 🔦1 neste turno',
  gainCheap: 'ganhe 1 carta de custo ≤3 da Fila',
  trash: 'destrua 1 carta',
  discard1: 'descarte 1 carta da mão',
  calm: 'acalma 1 cabeça do Cérbero',
  lure: 'pode jogar o osso: o Cérbero recua 2 nós',
  mirror: 'espelho: reflete o próximo olhar da Medusa',
  carveStone: 'destrua 1 Petrificado',
};
const TYPE = { start: 'Inicial', fixed: 'Mercado fixo', tool: 'Ferramenta', ally: 'Companheiro', find: 'Achado', beast: 'Bicho', hazard: 'Perigo', trophy: 'Troféu', curse: 'Maldição' };

export function cardLines(id) {
  const c = CARDS[id];
  const r = [];
  if (c.luz) r.push(`🔦${c.luz}`);
  if (c.prosa) r.push(`🤝${c.prosa}`);
  if (c.pic) r.push(`⛏${c.pic}`);
  if (c.draw) r.push(`compre ${c.draw}`);
  if (c.gold) r.push(`+🟡${c.gold}`);
  if (c.folego) r.push(`🫧+${c.folego}`);
  if (c.est > 0) r.push(`💥${c.est}`);
  if (c.est < 0) r.push(`💥${c.est}`);
  if (c.fx && FX[c.fx]) r.push(FX[c.fx]);
  if (c.acq?.gold) r.push(`ao adquirir: +🟡${c.acq.gold}`);
  if (c.acq?.est) r.push(`ao adquirir: 💥${c.acq.est}`);
  if (c.type === 'beast') {
    const w = c.reward || {};
    const rw = [w.gold && `+🟡${w.gold}`, w.luz && `🔦${w.luz}`, w.draw && `compre ${w.draw}`, w.crystal && `+💠${w.crystal}`, w.est && `💥${w.est}`, w.trophy && 'troféu'].filter(Boolean);
    r.push(`derrote com ⛏${c.fight}: ${rw.join(', ')}`);
    if (c.onEnter === 'allLose1') r.push('ao entrar na Fila: todos 🫧-1');
  }
  if (c.type === 'hazard') {
    if (c.onEnter === 'grisu') r.push('Grisu numa sala funda: entrar custa 🫧1');
    if (c.onEnter === 'infiltra') r.push('a água sobe 1 (ou todos 💥1)');
    if (c.onEnter === 'wakeHead') r.push('acorda 1 cabeça do Cérbero');
    if (c.onEnter === 'gaze') r.push('a Medusa olha na hora');
  }
  if (c.type === 'curse') r.push('sem efeito');
  return r;
}
export const cardType = (id) => TYPE[CARDS[id].type] || '';
export const relicName = (r) => `${RELICS[r].name} (✦${RELICS[r].pts})`;
export const itemName = (k) => MASCATE[k].name;
const SURFACE = { boca: { name: 'Boca da Mina', desc: 'a saída: chegue aqui com uma Relíquia para sair' }, barracao: { name: 'Barracão', desc: 'descanse: 🤝2 → 🫧+1, uma vez por turno' }, elevador: { name: 'Elevador' } };
export const roomLabel = (kind) => ROOMS[kind]?.name || SURFACE[kind]?.name || kind;
export const roomDesc = (kind) => ROOMS[kind]?.desc || SURFACE[kind]?.desc || '';

export const ROOM_COLOR = {
  boca: '#6b8f4e', barracao: '#7a5a3a', entrada: '#8a6a45', vazia: '#5b4a3a', respiro: '#5e7f86', geodo: '#3e8c7e', veio: '#a8862e',
  eco: '#6a5a72', capela: '#8a7a5a', deposito: '#6e5838', mascate: '#b0703a', elevador: '#4f5f6f', altar: '#8a6a2a', ninho: '#9a3a22',
  covil: '#7a5a2a', canil: '#6a5040', estatuas: '#6f6f68', espelhos: '#5f7f8a', pedreira: '#7a7a62',
};
export const ROOM_GLYPH = {
  boca: '⛺', barracao: '☕', entrada: '⛏', vazia: '', respiro: '🌬', geodo: '💠', veio: '🟡', eco: '〰', capela: '🕯', deposito: '📦',
  mascate: '🛒', elevador: '⇅', altar: '🏺', ninho: '🔥', covil: '🐕', canil: '🦴', estatuas: '🗿', espelhos: '🪞', pedreira: '⛰',
};
export const PLAYER_HEX = { urucum: '#B8402E', anil: '#2E4F8C', mata: '#3F7A3A', ipe: '#E3B72B' };
