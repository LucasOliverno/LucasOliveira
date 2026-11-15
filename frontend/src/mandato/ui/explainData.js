// Textos de apoio da mesa (glossário de siglas e como cumprir cada Meta Regional).
export const GLOSSARY = [
  ['RES', 'Residencial: moradias. Dão 👥 (população).'],
  ['COM', 'Comercial: lojas e serviços pagos. Dão 💰 de Renda, costumam pedir população mínima.'],
  ['IND', 'Industrial: fábricas. Dão 🔨 de Renda, mas geram ☁️ (poluição).'],
  ['INF', 'Infraestrutura: energia (⚡) e água (💧) para a cidade funcionar.'],
  ['VER', 'Verde: praças e parques. Baixam ☁️ e sobem 😊.'],
  ['SER', 'Serviços públicos: saúde, educação, Prefeitura.'],
  ['MON', 'Obra-Prima (monumento): vale ⭐2; só 2 contam por jogador.'],
  ['Aq', 'Custo de aquisição: o que você paga (💰/🗳️) para comprar a carta no mercado.'],
  ['Ob', 'Custo de obra: 🔨 que você gasta para construir o edifício na cidade.'],
  ['Req 👥', 'População mínima: com menos 👥 que isso, o edifício fica inativo (não rende).'],
  ['Cons', 'Consumo de ⚡/💧. Se a cidade consome mais do que tem de capacidade, falta energia/água.'],
  ['Renda', 'O que o edifício te dá no começo de cada turno seu.'],
  ['💰 Verba', 'Dinheiro: compra cartas.'],
  ['🔨 Obra', 'Mão de obra: constrói edifícios.'],
  ['🗳️ Articulação', 'Força política: cartas fortes, Projetos Regionais, Metas.'],
  ['😊 Aprovação', '0 a 10. Com ≥8 você ganha +🗳️1 por turno; com ≤2 há Protestos; em 0, Crise de Governo (−⭐1).'],
  ['☁️ Poluição', 'Com ≥6 você perde 1 😊 por rodada; com ≥9 a Renda cai.'],
  ['🕵️ Cubo / Saco', 'Cartas e ações corruptas põem cubos seus no Saco. Na Fiscalização, cubos sorteados custam 😊.'],
  ['Tesouro', 'O que sobra de 💰 no fim do turno, até o limite (normalmente 3), volta no turno seguinte.'],
  ['Selo', 'Ganho ao vencer uma Auditoria. 2 Selos = ⭐1.'],
  ['Facção', 'Tecnocratas, Verdes, Empresários e Sindicatos. Cartas com o ícone delas te avançam na trilha.'],
  ['Aliança', 'Quem tem 5+ numa Facção e é o único mais alto ganha o bônus daquela Facção.'],
  ['Tier I / II / III', 'Nível das cartas especiais: o baralho da Fila Especial começa no Tier I e sobe.'],
  ['🔔 Alerta', 'Carta que, ao entrar na Fila Especial, dispara uma Fiscalização.'],
];

// ---------------------------------------------------------------- dica da Meta Regional (como cumprir)
export const REGIONAL_HOWTO = {
  litoral: 'Construa 3 edifícios COM ou VER nas casas de Orla (a fileira do mar) e mantenha 😊 ≥ 7. Porto Pesqueiro, Farol e Resort (Projetos Regionais) contam.',
  montanha: 'Construa 2 edifícios IND nas casas de Jazida (J) e mantenha-os ativos, com ☁️ ≤ 4. A Mina de Cobre (Projeto Regional) é IND e vai em Jazida.',
  planicie: 'Chegue a 👥 ≥ 15 com 😊 ≥ 8 e ☁️ ≤ 2: muitas moradias (RES/Loteamento RES), praças VER e pouca indústria.',
  deserto: 'Compre o Poço do Oásis (Projetos Regionais) e construa na casa Oásis; depois tenha sobra de ⚡ e 💧 de 4 ou mais (Fazenda Solar ajuda no ⚡).',
  floresta: 'Mantenha ao menos 4 casas de Floresta intactas (não desmate) e chegue a 👥 ≥ 10. O Santuário pode ser construído em Floresta sem desmatar.',
  ilha: 'Compre Balsas Rápidas (Projetos Regionais) e ligue as 3 ilhas, e tenha Renda 💰 de 6 ou mais. Cada Balsa liga a ilha onde foi construída a outra.',
};
