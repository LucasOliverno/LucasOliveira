// Projeção do estado para UM jogador: o que ele pode ver numa mesa de verdade.
// Decks (ordem), mãos dos outros, baralhos de mercado/metas/rodadas e a semente nunca saem do servidor.
const hide = (arr) => (Array.isArray(arr) ? arr.map(() => null) : arr);

export function viewFor(state, pid) {
  const s = structuredClone(state);
  s.rng = 0;
  s.cont = s.cont ? 'begin' : null;
  s.market.deck = hide(s.market.deck);
  s.market.wdeck = hide(s.market.wdeck);
  s.goals.deck = hide(s.goals.deck);
  s.roundDeck = hide(s.roundDeck);
  for (const p of s.players) {
    p.deck = hide(p.deck); // nem a própria ordem do deck
    if (p.ex) p.ex.deck = hide(p.ex.deck);
    if (p.id !== pid) p.hand = hide(p.hand);
  }
  for (const pe of s.pending) {
    if (pe.pid !== pid && pe.data && pe.data.cards) pe.data = { ...pe.data, cards: hide(pe.data.cards) };
  }
  s.log = s.log.slice(-160);
  return s;
}
