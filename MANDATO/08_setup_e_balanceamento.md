# 08 — Setup, Draft de Terrenos e Balanceamento

> **Atualização v1.6 (Mandatos e Avaliação do Partido).** A partida tem **mandatos de 5 rodadas** — Curto ⭐11 em 2
> mandatos (10 rodadas), **Padrão ⭐17 em 3 mandatos (15 rodadas)**, Épico ⭐23 em 4 mandatos (20 rodadas); o solo segue
> ⭐10/12 sem mandatos. No fim de cada mandato o **Partido avalia os prefeitos** por **😊×2 + edifícios ativos**: 1º ⭐2,
> 2º ⭐1 (3+ prefeitos; empate no topo dá ⭐1 a cada um). Depois o Partido confere as contas: o Saco é sorteado com
> Tensão +1. O próximo mandato começa pelo pior avaliado. A Auditoria por rodada continua.
> Montanha, Ilha e Deserto começam com 😊+1; a Floresta reduz ☁️ no máx. −2 (era −3). Pacotes de Posição de 2, 3, 5 e 6
> jogadores recalibrados.

> **Atualização v1.5 (jogo de cidade).** Vale sobre o texto abaixo onde houver conflito:
> - **Sem Eventos de Rodada.** A carta de Rodada só define a **Auditoria** (Selo para o 1º no critério). Os eventos
>   desequilibravam os terrenos (diferença entre o melhor e o pior caiu de 0,57 para 0,21 sem eles, em simulação).
> - **Duração:** Curto ⭐12 em 12 rodadas · **Padrão ⭐16 em 16 rodadas** · Épico ⭐20 em 20 rodadas (solo segue ⭐10/12).
>   O deck de Rodada é reembaralhado quando acaba.
> - **Comprar terreno:** 1 por turno, uma casa vizinha da cidade, até a grade **5×5** (na Ilha, a principal vai até 3×4 e
>   cada ilha menor até 2×3). Custa 💰3, depois +💰1 a cada compra (Ilha −💰1). O tipo da casa nova segue o mapa
>   (Orla no Litoral, Encosta/Jazida na Montanha, Rio na Planície, Duna no Deserto, Costa na Ilha).
> - **Marcos da Cidade** (⭐1 cada, uma vez por partida): 8, 12 e 16 edifícios; 👥 6 e 👥 10; 5 Zonas diferentes ativas.
>   Em simulação, a cidade passou a render ~27% do Mérito e as Metas caíram de 47% para ~30%.
> - **Terrenos:** Ilha — Prefeitura rende +🔨1, Loteamento custa 💰1, terreno −💰1. Montanha — Prefeitura rende +💰1.
>   Deserto — Loteamento INF ⚡ rende ⚡+2 (era +3). Pacotes de Posição de 4, 5 e 6 jogadores recalibrados.

## 1. Preparação passo a passo

1. **Sorteio de ordem de escolha:** cada jogador sorteia uma ficha numerada (1 a N). Essa é a sua **ordem de escolha de terreno** (e o assento).
2. **Draft de terreno:** na ordem 1→N, cada jogador escolhe 1 dos terrenos disponíveis. Com N < 6, **revele N+1 terrenos aleatórios** (o último a escolher tem 2 opções; não vê só "o que sobrou").
3. **Pacote de Posição:** ao escolher, cada jogador recebe um pacote conforme a ordem (seção 2).
4. **Tabuleiro pessoal:** coloque a Prefeitura e a Moradia Popular, marque 😊5, Tesouro (inicial + pacote), 10 cubos 🕵️ no estoque.
5. **Deck inicial:** 10 cartas básicas (`05`), embaralhe, compre 5.
6. **Mercado Padrão** (`06`) e **Fila Especial** (6 do topo do Tier I) (`07`).
7. **Vitrine de Obras-Prima** (3 ou 4).
8. **Metas** (4–6 viradas) e **Metas Regionais** de cada jogador.
9. **Saco:** coloque os cubos neutros conforme a tabela do tabuleiro (`03 §6`). **Tensão: 3.**
10. **Deck de Rodada:** embaralhe as 12 cartas.
11. **Token de Primeiro Jogador:** vai para o jogador de **ordem N** (o último a escolher). Na **rodada 1** a ordem de turno é **inversa** (N → 1). A partir da rodada 2 o token passa para o jogador de ordem 1 e segue no sentido horário.

## 2. Pacote de Posição (vantagem "singela" para quem escolhe por último)

A ideia: quem escolhe por último **vê tudo o que os outros escolheram** (vantagem de informação) mas tem **menos opções de terreno**. O pacote compensa a perda de opções, mas deve ser pequeno o bastante para que a *primeira escolha* continue desejável.

**Ajuste v1.1 (simulação):** jogar primeiro na rodada 1 já vale ~10 pp de vitória, então o pacote original compensava em dobro o último assento (e +😊 o levava rápido ao bônus de 😊8). O pacote agora é só Tesouro e depende do número de jogadores:

| Jogadores | Assento 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| 2 | — | +💰2 | | | | |
| 3 | — | +💰3 | +💰2 | | | |
| 4 | — | +💰2 | +💰1 | +💰1 | | |
| 5 | — | +💰1 | +💰2 | — | — | |
| 6 | — | +💰2 | +💰2 | — | — | +💰1 |

O **último a escolher continua jogando primeiro na rodada 1**. Valores calibrados com o GreedyBot (draft por preferência de terreno); confirme em mesa com humanos.

> **Por que "singela"?** 💰3 equivale a uma compra pequena; 1 😊 equivale a ~1,5 PU; uma carta Tier I vale ≈ 3 PU. Em conjunto, ≈ 8–9 PU, aproximadamente **uma rodada de desvantagem** acumulada que o último jogador estaria perdendo ao ter menos terrenos para escolher.

**Para ajustar:** após simulação, se a taxa de vitória por ordem de escolha ficar > ±2 pp do esperado, mexa primeiro no Tesouro, depois no 😊, por último na carta.

## 3. Rubber-banding embutido (sem punir demais o líder)

| Mecanismo | Quem ajuda | Intensidade |
|---|---|---|
| **Olho do Partido** (⭐6+) | Quem está atrás (líder tem mais risco) | Média |
| **Alvo Nacional** (⭐8+) | Quem está atrás | Média |
| **Visita do Ministro** (RD-07) | O último em ⭐ | Baixa (1 vez) |
| **Prata nas Metas** | Segundo colocado | Baixa |
| **Auditoria — 2º lugar** | Ajuda quem não ganhou | Baixa |
| **Vazamento de Documentos** | Mira o líder | Alta (mas custa 🗳️5) |
| **Limite de 2 Obras-Prima com ⭐** | Impede runaway | Estrutural |
| **1 Meta por turno** | Impede monopolizar Metas | Estrutural |

## 4. Anti-padrões a evitar

| Problema | Sintoma | Solução |
|---|---|---|
| **Snowball econômico** | O jogador que tem 3 IND no turno 4 vence sempre | Poluição + Smog, Req de 👥, Olho do Partido |
| **Turtling** (não correr) | Ninguém pontua e o jogo arrasta | Tensão sobe; Metas fecham |
| **Griefing** | Alvo sempre o mesmo | Regra de alvo (não repetir), Contra-Inteligência, Intrigas exiladas |
| **Kingmaking** | Jogador que não pode vencer decide quem vence | Intrigas sem recompensa direta; foco em ⭐ próprio |
| **Corrupção ótima** | Todos usam só cartas corruptas | Tensão cresce, cubos nunca saem sem custo; Investigação |
| **Mão morta** | Edificação sem 🔨 na mão | *Vender Lote* por 💰1; Licitação barata |
| **Terreno dominante** | Um terreno vence >20% | Ajustar Traço/Fraqueza, custos de Regionais |
| **Meta fácil demais** | Meta é tomada sempre no mesmo turno | Subir dificuldade; checar com bots |

## 5. Alvos numéricos do jogo (hipóteses para validar)

| Métrica | Alvo (4 jogadores) |
|---|---|
| Duração (rodadas) | **10–12** |
| Duração (minutos, mesa) | 70–90; **digital: 35–50 com timer** |
| Mérito total conquistado por partida | 20–26 (entre todos) |
| Distribuição das fontes de ⭐ | Metas 30–40% · Obras-Prima 20–25% · Facções 20–30% · Selos 10–15% |
| Fiscalizações por partida | 6–9 |
| Investigações por partida | 0–2 |
| Crises de Governo (😊=0) | ≤ 1 por partida |
| Taxa de "mão morta" (nenhum recurso útil) | < 8% das mãos |
| Win rate por assento (com compensação) | 25% ± 2 pp (4 jogadores) |
| Win rate por terreno | 16,7% ± 3 pp (6 jogadores) |
| Rodada média do 1º ⭐5 | 6–7 |
| Variância no 🗳️ por turno | média 1,5–2,5 |

## 6. Alavancas (knobs) por ordem de uso

| Ordem | Alavanca | Efeito |
|---|---|---|
| 1 | **Custo Aq** das cartas Tier I | Ritmo do early game |
| 2 | **Renda base** (Prefeitura) | Primeiras rodadas |
| 3 | **Ouro/Prata das Metas** | Quanto vale correr x ficar |
| 4 | **Tensão** (3→6) e neutros | Duração e pressão |
| 5 | **Marco de Facção** (3→4) | Peso da Facção |
| 6 | **Limite de Obras-Prima** (2 → 3) | Peso do caminho de construção |
| 7 | **⭐ alvo** (10 → 9 / 11) | Duração global |
| 8 | **Pacote de Posição** | Equilíbrio entre assentos |
| 9 | **Traços/Fraquezas** | Equilíbrio entre terrenos |
| 10 | **Tesouro máximo** | Poupar x gastar |

## 7. Plano de playtest

### Fase A — Protótipo de papel (1–2 semanas)
- Imprimir: básico, padrão, Tier I e II, 2 terrenos (Litoral, Montanha), Metas, Rodadas.
- Partidas 2–3 jogadores, 5 sessões. Registrar: rodadas, ⭐ por fonte, turnos mortos, confusão de regras.

### Fase B — Simulador (paralelo)
- Implementar o motor (ver `09`) e rodar **10.000 partidas** com bots (aleatório, guloso, planejador por terreno).
- Medir todos os alvos da seção 5. Ajustar as alavancas.

### Fase C — Playtest cego (online)
- Salas privadas, 6–10 grupos; coletar telemetria + questionário.
- Foco: legibilidade, tempo por turno, sensação de "cidade crescendo".

### Perguntas-chave por fase

1. A decisão **construir × manter no deck** é interessante ou óbvia?
2. Existe **uma** estratégia dominante? (taxa de vitória por tag de estratégia)
3. O jogo "fecha" ou arrasta? (distribuição de rodadas)
4. As Intrigas parecem **justas** ou punitivas?
5. A Fiscalização cria **tensão** sem frustrar? (taxa de abandono)
6. O assento e o terreno **importam demais**?

## 8. Especificação do harness de simulação

```
bots:
  RandomBot       — ação aleatória legal
  GreedyBot       — maximiza PU imediato (tabela do 07 §7)
  PlannerBot(T)   — segue um "plano" por terreno T (Facção alvo + Metas)
  RiskyBot        — usa cartas corruptas sempre que possível
métricas:
  rounds, win_by_seat, win_by_terrain, merit_by_source, fiscalizations,
  investigations, crises, dead_hands, resources_unspent, building_count, gini_merit
saída:
  CSV por partida + painel (histogramas, tabelas de win rate)
critério de ajuste:
  rodar 5 sementes × 2.000 partidas; alterar 1 alavanca por vez
```

## 9. Checklist de balanceamento (rápido)

- [ ] Qualquer terreno vence entre 13,7% e 19,7% (6p)
- [ ] Qualquer assento vence 23–27% (4p)
- [ ] Nenhuma carta aparece em > 60% das vitórias (exceto básicas)
- [ ] Nenhuma Meta é tomada em > 70% das partidas pelo mesmo jogador de ordem
- [ ] Pelo menos 3 de 4 Facções têm Aliança tomada em ≥ 40% das partidas
- [ ] Tensão não dispara mais de 2 Investigações/partida em média
- [ ] 80%+ das partidas terminam entre as rodadas 9 e 13

## 10. Variante de equilíbrio: "Compra de Terreno por Lance"
Opcional para grupos competitivos: em vez de escolha por ordem, cada jogador recebe 💰5 de **pontos de lance**, e leilões sucessivos decidem terreno; o que sobrar vira Tesouro inicial. Mais interativa, mais complexa.
