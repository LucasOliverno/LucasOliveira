# 03 — Tabuleiro Principal, Cargos, Facções, Metas e Rodadas

## 1. Layout do tabuleiro principal

```
┌────────────────────────────────────────────────────────────────────────┐
│  TRILHA DE MÉRITO / CARGOS  ⭐0 ─ 1 ─ 2 ─ 3 ─ 4 ─ 5 ─ 6 ─ 7 ─ 8 ─ 9 ─ 10 │
├───────────────┬──────────────────────────┬─────────────────────────────┤
│ CARTA DE      │  FACÇÕES (trilhas 0–6)   │  METAS DO PARTIDO           │
│ RODADA        │  🔧 ▮▮▮▮▮▮▯  [Aliança]    │  [Meta1] [Meta2] [Meta3]    │
│ (Evento +     │  🌿 ▮▮▮▮▮▮▯  [Aliança]    │  [Meta4] [Meta5] [Meta6]    │
│  Auditoria)   │  💼 ▮▮▮▮▮▮▯  [Aliança]    │   Ouro ⭐2 | Prata ⭐1       │
│ Rodada: ◯◯◯…  │  ✊ ▮▮▮▮▮▮▯  [Aliança]    │                             │
├───────────────┴──────────────────────────┴─────────────────────────────┤
│  MERCADO PADRÃO:  [Loteamento][Licitação][Explorar][Lobby]             │
├────────────────────────────────────────────────────────────────────────┤
│  FILA ESPECIAL (6):  [1][2][3][4][5][6]        Deck Especial ▒▒▒▒       │
├────────────────────────────────────────────────────────────────────────┤
│  VITRINE DE OBRAS-PRIMA (3–4):  [M][M][M]                               │
├────────────────────────────────────────────────────────────────────────┤
│  SACO DE CUBOS 🕵️ │ TENSÃO: 3 ▸ 4 ▸ 5 ▸ 6 │ SELOS 🎖️ │ TOKEN 1º JOGADOR  │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Trilha de Mérito e Cargos

| ⭐ | Cargo (flavor) | Efeito |
|---|---|---|
| 0–1 | Prefeito Novato | — |
| 2–3 | Prefeito Reeleito | — |
| 4–5 | Secretário Estadual | — |
| 6–7 | Deputado | **Olho do Partido:** +1 🕵️ no Saco no fim de cada rodada |
| 8–9 | Governador | **Alvo Nacional:** Intrigas contra você custam −1 🗳️ para os outros |
| **10** | **Ministro do Partido** | **Vitória (fim da rodada)** |

Os efeitos de cargo são **penalidades de líder** que servem de freio natural.

## 3. Facções

| Facção | Ícone | Estilo | Aliança (⭐1 + bônus enquanto tiver o token) |
|---|---|---|---|
| Tecnocratas | 🔧 | Infraestrutura, universidades, planejamento | +2 de capacidade de ⚡ **e** 💧; Edificações INF custam −🔨1 (mín. 1) |
| Verdes | 🌿 | Parques, reciclagem, ecologia | −1 ☁️ total; Edificações VER custam −🔨1 (mín. 1) |
| Empresários | 💼 | Comércio, finanças, propaganda | +💰1 no início do turno; Tesouro máximo +2 |
| Sindicatos | ✊ | Indústria, obras, serviços sociais | +🔨1 no início do turno; em cada Fiscalização, reduza em 1 o total de perdas de 😊 que você sofre (mín. 0) |

> **Marco 3:** ⭐1 (uma vez por Facção por jogador). **Aliança:** ≥5 e único mais alto.

## 4. Deck de Metas (18 cartas)

Cada Meta tem **Ouro (⭐2)** e **Prata (⭐1)**. Verificada no momento da reivindicação.

| ID | Nome | Categoria | Condição | Dif. |
|---|---|---|---|---|
| G-01 | Polo Comercial | Economia | 3 COM construídos e Renda 💰 total ≥ 5 por turno | ★★ |
| G-02 | Cinturão Industrial | Economia | 3 IND e Renda 🔨 total ≥ 6 por turno | ★★ |
| G-03 | Cofres Cheios | Economia | Tesouro no máximo no início do turno | ★ |
| G-04 | Metrópole | População | 👥 ≥ 20 | ★★ |
| G-05 | Bairro Planejado | População | 4 RES formando um quadrado 2×2 | ★★ |
| G-06 | Distrito Verde | Ambiente | 3 VER e ☁️ ≤ 0 | ★★ |
| G-07 | Autossuficiência | Infra | Excedente de ⚡ ≥ 3 **e** de 💧 ≥ 3 | ★★ |
| G-08 | Cidade Limpa | Ambiente | ☁️ ≤ 2 com 👥 ≥ 12 | ★★★ |
| G-09 | Povo Feliz | Ambiente | 😊 = 10 | ★★★ |
| G-10 | Rede Completa | Infra | 1 edifício de cada Zona: RES, COM, IND, INF, VER, SER | ★★ |
| G-11 | Mãos Limpas | Político | 0 cubos 🕵️ seus no Saco e ≥ 8 edifícios | ★★ |
| G-12 | Articulador | Político | ≥ 2 em todas as 4 Facções | ★★★ |
| G-13 | Líder de Bancada | Político | Único mais alto em 2 Facções | ★★★ |
| G-14 | Gabinete Completo | Político | 2 Decretos no Gabinete | ★ |
| G-15 | Canteiro de Obras | Construção | Construir 3 edifícios no mesmo turno | ★★ |
| G-16 | Grande Planejador | Construção | 12 edifícios na grade (inclui Prefeitura) | ★★★ |
| G-17 | Explorador | Exploração | Ter resolvido 6 cartas de Exploração | ★★ |
| G-18 | Sobrevivente | Resiliência | Passar por 3 Fiscalizações seguidas sem tomar nenhum cubo | ★★ |

**Regras de Metas:** 1 por turno; Investigação impede reivindicar na rodada; o jogador não pode tomar as duas vagas (Ouro e Prata) da mesma Meta.

## 5. Deck de Rodada (12 cartas)

Embaralhe as 12 cartas. A **parte superior** é o **Evento** (aplicado ao revelar). A **parte inferior** é a **Auditoria** (resolvida no fim da rodada).

| ID | Evento | Auditoria (1º / 2º) |
|---|---|---|
| RD-01 | **Boom Imobiliário:** quem tem 👥 ≥ 6 ganha 💰2 no Tesouro | Maior 👥 |
| RD-02 | **Temporada de Chuvas:** Litoral/Ilha: 1 edifício em Orla/Costa fica inativo na rodada. Deserto: +💧2 de capacidade | Maior 😊 |
| RD-03 | **Onda de Calor:** Deserto/Planície: 💧 −2 de capacidade. Floresta: −1 😊 | Maior excedente de 💧 |
| RD-04 | **Greve de Transportes:** *Licitação* custa +💰1 | Menor ☁️ (desempate: maior 👥) |
| RD-05 | **Feriado Nacional:** todos +1 😊 | Mais edifícios na grade |
| RD-06 | **Crise Energética:** ⚡ −2 de capacidade para todos (Deserto solar: imune) | Maior excedente de ⚡ |
| RD-07 | **Visita do Ministro:** quem tem **menos ⭐** (empatados incluídos) avança 1 em uma Facção à escolha | Maior soma de Facções |
| RD-08 | **Abalo Sísmico:** Montanha: 1 edifício inativo na rodada. Todos: descarte as 2 cartas mais antigas da Fila Especial e reponha | Maior Tesouro |
| RD-09 | **Escândalo Nacional:** Fiscalização imediata com Tensão +1 | Menos 🕵️ seus no Saco |
| RD-10 | **Feira Internacional:** COM geram +💰1 na rodada (+2 para Litoral/Ilha em Orla) | Maior Renda 💰 |
| RD-11 | **Sinal Verde do Partido:** cada VER seu dá +1 😊 (máx. +3) | Mais VER |
| RD-12 | **Corte Orçamentário:** Tesouro máximo = 1 neste fim de rodada | Maior Renda 🔨 |

**Último card:** após RD-12 resolver, a rodada 12 é a última.

## 6. Setup por número de jogadores

| Jogadores | Metas visíveis | Obras-Prima visíveis | Neutros no Saco | Observações |
|---|---|---|---|---|
| 1 (solo) | 4 | 3 | 6 | Rival (ver `10`) |
| 2 | 4 | 3 | 6 | Auditoria só premia o 1º |
| 3 | 5 | 3 | 7 | — |
| 4 | 5 | 3 | 8 | Formato de referência |
| 5 | 6 | 4 | 9 | — |
| 6 | 6 | 4 | 10 | Timer sugerido no digital |

## 7. Tensão

| Rodada | 1–3 | 4–6 | 7–9 | 10+ |
|---|---|---|---|---|
| Cubos sorteados por Fiscalização | 3 | 4 | 5 | 6 |

A Tensão é o **relógio do jogo**: quanto mais longa a partida, mais perigoso é manter suspeitas no Saco.
