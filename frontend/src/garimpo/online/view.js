// Projeção do estado do GARIMPO para UM jogador: só o que ele veria numa mesa de verdade.
// Nunca saem do servidor: a ordem dos baralhos (o seu vai ordenado; o Túnel, escondido), as mãos dos outros, os montes de peças de Sala,
// pilhas de Relíquias (só a quantidade) e a semente do sorteio.
const hide = (arr) => (Array.isArray(arr) ? arr.map(() => null) : arr);

export function viewFor(state, pid) {
  const s = structuredClone(state);
  s.rng = 0;
  s.seed = 0;
  s.tunnel = hide(s.tunnel);
  if (s.map?.decks) for (const k of Object.keys(s.map.decks)) s.map.decks[k] = hide(s.map.decks[k]);
  if (s.map?.piles) for (const k of Object.keys(s.map.piles)) s.map.piles[k] = hide(s.map.piles[k]);
  for (const p of s.players) {
    p.deck = [...p.deck].sort(); // a ordem de compra é segredo; o conteúdo é público (todos viram as compras)
    if (p.id !== pid) p.hand = hide(p.hand);
  }
  s.log = s.log.slice(-160);
  return s;
}

// Quem precisa agir agora: o dono da escolha pendente ou o jogador da vez
export function actor(state) {
  if (state.over) return null;
  if (state.pending.length) return state.pending[0].pid;
  return state.order[state.turn];
}
