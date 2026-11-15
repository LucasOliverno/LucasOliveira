import { ZONES } from '../data.js';

import { ART_IDS, TERRAIN_ART } from '../artManifest.js';

// Arte gerada por scripts/slice-art.mjs (public/mandato/art/<ID>.webp). Sem arte, as cartas caem na ilustração SVG provisória.
export const HAS_ART = ART_IDS;
// arte de uma instância construída: Loteamento usa a versão da Zona escolhida (P-01-RES etc.) se existir
export const instArt = (b) => (b && b.v && ART_IDS.has(`${b.id}-${b.v}`) ? `${b.id}-${b.v}` : b && ART_IDS.has(b.id) ? b.id : null);
export const artUrl = (id) => `${import.meta.env.BASE_URL}mandato/art/${id}.webp`;
export const terrainMap = (key) => (TERRAIN_ART.includes(key) ? `${import.meta.env.BASE_URL}mandato/art/T-${key}.webp` : null);

export const TYPE_BAND = {
  basic: { bg: '#CFCABD', fg: '#1B2A41', label: 'Básica' },
  standard: { bg: '#E4D8BF', fg: '#1B2A41', label: 'Padrão' },
  admin: { bg: '#1B2A41', fg: '#F3EBDD', label: 'Administração' },
  decree: { bg: '#E0A526', fg: '#1B2A41', label: 'Decreto' },
  intrigue: { bg: '#6B3F69', fg: '#F3EBDD', label: 'Intriga' },
  wonder: { bg: '#C9A227', fg: '#1B2A41', label: 'Obra-Prima' },
};

export function bandFor(card) {
  if (card.type === 'building') {
    const z = card.zones[0];
    return { bg: ZONES[z].color, fg: ['COM', 'IND', 'INF'].includes(z) ? '#fff' : '#1B2A41', label: card.regional ? 'Regional' : 'Edificação' };
  }
  return TYPE_BAND[card.type];
}

const RESI = { v: '💰', o: '🔨', a: '🗳️' };
const FI = { tec: '🔧', ver: '🌿', emp: '💼', sin: '✊' };
export const costText = (cost) => ['v', 'o', 'a'].filter((k) => cost && cost[k]).map((k) => `${cost[k]}${RESI[k]}`).join(' ');

export function describeOps(ops = []) {
  return ops.map((o) => {
    switch (o.op) {
      case 'gain': return `${RESI[o.r]}${o.n}`;
      case 'draw': return `Compre ${o.n}`;
      case 'appr': return `${o.n > 0 ? '+' : ''}${o.n} 😊${o.ifTile ? ' (se tiver COM em Orla)' : ''}`;
      case 'cube': return o.n > 0 ? `adicione ${o.n} 🕵️` : `remova ${-o.n} 🕵️`;
      case 'adv': return `+${o.n} ${FI[o.f]}`;
      case 'advChoice': return 'avance em uma Facção à escolha';
      case 'off': return `1 edifício ${o.kind === 'O' ? 'em Orla' : o.kind === 'E' ? 'em Encosta' : ''} inativo até ${o.until === 'round' ? 'o fim da rodada' : 'seu próximo turno'}`;
      case 'flag': return { encostaDisc: 'a próxima Edificação em Encosta neste turno custa −2 🔨', firstBuildDisc: 'a primeira Edificação neste turno custa −2 🔨 (mín. 0)', nextResPop: 'o próximo RES construído tem 👥 +3', rotaTwice: 'a Rota Marítima pode ser usada duas vezes neste turno' }[o.k] || '';
      case 'next': return 'no seu próximo início de turno, ⚡ −2';
      case 'cap': return `marcador permanente: ${o.res === 'w' ? '💧' : '⚡'} +${o.n} de capacidade`;
      case 'drawDiscard': return `compre ${o.draw}, depois descarte ${o.discard} da mão`;
      case 'desmate': return o.forced ? 'desmate 1 Floresta (obrigatório)' : 'desmate 1 Floresta gratuitamente';
      default: return '';
    }
  }).filter(Boolean).join('; ').replace(/^./, (c) => c.toUpperCase());
}
