# 09 — Versão Web Multiplayer (1 a 6 jogadores)

Objetivo: rodar o jogo no navegador, no seu site, com **salas, convites por link, 1–6 jogadores, bots, reconexão e partidas assíncronas ou em tempo real**.

> **Decisão em aberto:** qual a stack do site atual (estático, WordPress, Next.js, PHP…)? O jogo precisa de um **servidor com WebSocket** em algum lugar (pode ser subdomínio: `jogo.seusite.com`). O front pode ficar embutido em qualquer site.

---

## 1. Requisitos

| Tipo | Requisito |
|---|---|
| Salas | Criar sala, código de 6 caracteres, link de convite, nome e cor por jogador, host com controles |
| Jogadores | 1–6 humanos; bots preenchem assentos; espectadores opcionais |
| Tempo real | Turnos sequenciais com timer opcional; atualização instantânea via WebSocket |
| Robustez | Reconexão automática; servidor autoritativo; estado salvo |
| Informação oculta | Mãos e ordem dos decks nunca vão ao cliente de outros jogadores |
| Mobile | Funciona em celular (layout vertical, gestos de toque) |
| i18n | pt-BR primeiro; en depois |
| Balanceamento | Telemetria + simulação headless com o mesmo motor |

---

## 2. Arquitetura

```
 ┌──────────────┐   HTTPS (estático)   ┌──────────────────────┐
 │  Navegador   │ ───────────────────▶ │  Seu site / CDN      │
 │  (React+TS)  │                      │  (build do front)    │
 └──────┬───────┘                      └──────────────────────┘
        │ WebSocket (wss://jogo.seusite.com/ws)
        ▼
 ┌────────────────────────────────────────────┐
 │  Servidor de jogo (Node.js + TypeScript)   │
 │  ┌──────────────┐  ┌────────────────────┐  │
 │  │ Gerenciador  │  │ Sala (1 por jogo)  │  │
 │  │ de salas     │─▶│  - Motor de regras │  │
 │  │ (lobby)      │  │  - Estado + Log    │  │
 │  └──────────────┘  │  - Timers / Bots   │  │
 │                    └─────────┬──────────┘  │
 └──────────────────────────────┼─────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ Persistência (SQLite /   │
                  │ Postgres / Redis)        │
                  └──────────────────────────┘
```

**Princípios:**
1. **Servidor autoritativo:** o cliente envia *comandos*; o servidor valida e devolve *eventos/estado visível*.
2. **Motor de regras puro** (sem I/O), em TypeScript, compartilhado por servidor, cliente (previsão/animações) e simulador.
3. **Determinismo:** todo sorteio usa um **PRNG com semente** (ex.: `mulberry32`/`seedrandom`). Com a semente + log de comandos, reproduz-se qualquer partida (replays, bugs, balanceamento).
4. **Dados das cartas fora do código:** JSON/YAML (`cards/*.json`) validados por esquema (Zod).

---

## 3. Stack recomendada (e alternativas)

| Camada | Recomendação | Alternativas |
|---|---|---|
| Linguagem | **TypeScript** em tudo | — |
| Servidor | **Node.js + `ws`** (ou **Colyseus**) | **boardgame.io** (lobby + multiplayer prontos), **Socket.IO**, **PartyKit/Cloudflare Durable Objects** (sem servidor, uma instância por sala) |
| Front | **React + Vite** | Svelte/Solid |
| UI do tabuleiro | **HTML/CSS + SVG** para grade e cartas (nítido e acessível) | **PixiJS** se quiser animações pesadas |
| Estado no cliente | **Zustand** | Redux Toolkit |
| Arrastar e soltar | **dnd-kit** | HTML5 DnD |
| Animação | **Framer Motion** | GSAP |
| Banco | **SQLite** (início) → **Postgres** | Redis para presença/pub-sub |
| Testes | **Vitest** + **fast-check** (propriedades) | Jest |
| Deploy | **Docker** em VPS (Hetzner/Fly.io/Render) + **Caddy/Nginx** (TLS + proxy WS) | Cloudflare Workers/DO |

**Atalho possível:** usar **boardgame.io** para ganhar rápido lobby, turnos, estado secreto por jogador, bots (MCTS) e persistência. O custo é aceitar o modelo de estado/movimentos dele. Recomendo se a meta for **validar o jogo rápido**; para controle total de UX/escala, motor próprio.

---

## 4. Estrutura do repositório

```
mandato/
├─ packages/
│  ├─ engine/            # regras puras (sem I/O)
│  │   ├─ src/
│  │   │   ├─ state.ts       # tipos do estado
│  │   │   ├─ commands.ts    # tipos de comandos
│  │   │   ├─ rules/         # build, buy, fiscalization, auditing...
│  │   │   ├─ effects/       # interpretador do DSL de efeitos
│  │   │   ├─ rng.ts
│  │   │   └─ views.ts       # projeção "visível para o jogador X"
│  │   └─ test/
│  ├─ data/              # cartas, terrenos, metas, rodadas (JSON + schemas)
│  ├─ bots/              # RandomBot, GreedyBot, PlannerBot
│  └─ sim/               # harness de simulação em massa
├─ apps/
│  ├─ server/            # lobby + salas + WebSocket
│  └─ web/               # React: telas, componentes, assets
└─ docs/                 # estes .md
```

---

## 5. Modelo de estado (resumo em TypeScript)

```ts
type Res = "verba" | "obra" | "articulacao";
type Zone = "RES"|"COM"|"IND"|"INF"|"VER"|"SER"|"MON";
type Faction = "tec"|"verdes"|"emp"|"sind";

interface PlayerState {
  id: string; name: string; color: string; seat: number; terrain: TerrainId;
  merit: number; seals: number; approval: number; treasury: number;
  deck: CardId[]; hand: CardId[]; discard: CardId[]; exiled: CardId[];
  grid: Tile[];                   // 16 casas
  cabinet: (CardId|null)[];       // 2 decretos
  factions: Record<Faction, number>;
  cubesInSupply: number;
  turnPool: Record<Res, number>;  // evapora no fim do turno
  flags: Record<string, unknown>; // efeitos temporários
}

interface Tile { id: string; kind: TileKind; building?: PlacedBuilding; cleared?: boolean; inactiveUntil?: number }

interface GameState {
  seed: string; round: number; phase: "lobby"|"draft"|"play"|"end";
  turnOrder: string[]; activeIndex: number; firstPlayerToken: string;
  players: Record<string, PlayerState>;
  market: { standard: Pile[]; row: CardId[]; specialDeck: CardId[]; masterpieces: CardId[] };
  goals: GoalSlot[]; factionTokens: Record<Faction, string|null>;
  bag: { neutral: number; byPlayer: Record<string, number> };
  tension: number; roundDeck: RoundCardId[]; currentRound?: RoundCardId;
  log: Event[];                   // para replay e UI
}
```

**Derivados calculados** (não armazenar): 👥, ☁️, ⚡/💧, Renda por turno, edifícios ativos, adjacências. Isso evita bugs de estado inconsistente.

---

## 6. Comandos e eventos

O cliente envia **comandos**; o servidor responde com **eventos** (e opcionalmente o estado visível completo).

| Comando | Payload | Validação principal |
|---|---|---|
| `PLAY_CARD` | `cardId` | Está na mão; é o turno do jogador |
| `BUY_CARD` | `source: standard|row`, `index` | Recursos suficientes |
| `BUILD` | `cardId, tileId, zone?` | Casa vazia; recursos; Req do terreno |
| `UPGRADE` | `cardId, tileId` | Mesma zona |
| `DEMOLISH` | `tileId` | 🔨1 |
| `SELL_LOT` | `cardId` | Edificação na mão |
| `BUILD_MASTERPIECE` | `index, tileId` | Custo; restrições |
| `CLAIM_GOAL` | `goalId` | Condição verificada no servidor |
| `TRADE_SEALS` | — | ≥2 selos |
| `USE_INTRIGUE` | `cardId, targetId?` | 1/turno; regra de alvo |
| `RESPOND_REACTION` | `useCard: boolean` | Janela de reação ativa |
| `END_TURN` | — | — |
| `PICK_TERRAIN` | `terrainId` | É a sua vez no draft |

**Eventos (exemplos):** `RESOURCE_GAINED`, `CARD_DRAWN` (dados ocultos para outros), `BUILDING_PLACED`, `FISCALIZATION_RESOLVED`, `MERIT_CHANGED`, `ROUND_STARTED`, `AUDIT_RESOLVED`, `GAME_ENDED`.

**Janela de reação:** quando uma Intriga mira um jogador com *Contra-Inteligência* na mão, o servidor abre uma **janela de 8–15 s** (configurável). Se o jogador não tiver a carta, o servidor **não revela** isso: aplica um atraso fixo aleatório para não vazar informação.

---

## 7. Efeitos das cartas como dados (DSL)

```json
{
  "id": "A1-01",
  "name": "Chefe de Gabinete",
  "type": "admin",
  "faction": null,
  "cost": { "verba": 3 },
  "effects": [
    { "op": "gain", "res": "articulacao", "n": 1 },
    { "op": "draw", "n": 1 }
  ]
}
```

```json
{
  "id": "E1-02",
  "name": "Mercadinho de Bairro",
  "type": "building",
  "zone": "COM",
  "faction": "emp",
  "cost": { "verba": 3 },
  "build": { "obra": 1 },
  "consumes": { "energia": 1 },
  "reqPop": 4,
  "income": [
    { "op": "gain", "res": "verba", "n": 1 },
    { "op": "gainPerAdjacent", "zone": "RES", "res": "verba", "n": 1, "max": 2 }
  ]
}
```

**Operadores sugeridos:** `gain`, `draw`, `exile`, `addCubes`, `removeCubes`, `modApproval`, `advanceFaction`, `gainPerAdjacent`, `discountBuild`, `trigger`, `ifCondition`. Casos únicos podem usar **funções nomeadas** registradas em código (`hook: "oasisWell"`), mas o objetivo é 90% em dados para facilitar balanceamento sem deploy.

---

## 8. Informação oculta e visão por jogador

A função `viewFor(state, playerId)` devolve só o que o jogador pode ver:
- **Sua mão**, seu deck (apenas contagem; ordem oculta), seu descarte (visível a todos).
- **Dos outros:** número de cartas na mão/deck; grade e edifícios (públicos); Tesouro (público por padrão).
- **Mercado e Metas:** públicos.
- **Saco:** só *contagem por cor* (cubos de cada jogador são públicos; nunca se vê o resultado de uma tirada antes de ela acontecer).
- O **log** enviado já está **filtrado** (ex.: `CARD_DRAWN` mostra a carta só ao dono).

---

## 9. Salas, convites e lobby

### 9.1 Ciclo de vida da sala

```
CRIADA → LOBBY → SORTEIO → DRAFT DE TERRENO → EM JOGO → FIM → ARQUIVADA
              ▲                                     │
              └─────── "jogar de novo" ◀────────────┘
```

### 9.2 Funcionalidades

| Recurso | Detalhe |
|---|---|
| **Criar sala** | Botão "Nova partida" → gera `ABC123` e o link `https://jogo.seusite.com/s/ABC123` |
| **Convite** | Copiar link, QR code, Web Share API no celular |
| **Entrar** | Link abre a sala; pede apenas **apelido** (convidado) e cor; login opcional |
| **Assentos** | 6 slots; cada slot: Humano / Bot (nível) / Vazio. Mínimo 1 jogador |
| **Host** | Pode expulsar, trocar bots, definir regras (⭐ alvo, timer, modo curto), iniciar |
| **Pronto** | Cada humano marca "Pronto"; o host só inicia com todos prontos |
| **Espectadores** | Entram por link `?spectate=1`; sem informação oculta |
| **Reconexão** | `playerToken` guardado em `localStorage`; ao reabrir o link, retoma o assento |
| **Timer** | Opcional: 60/90/120 s por turno + banco de tempo; ao expirar, um **bot assume** o turno |
| **AFK** | 2 turnos expirados → bot assume definitivamente (pode voltar) |
| **Expiração** | Sala vazia por 30 min é arquivada; partidas ativas persistem 7 dias |
| **Chat** | Texto + emotes; sanitizar HTML; rate limit |
| **Revanche** | Mesma sala, mesmos jogadores, nova semente |

### 9.3 Início de partida (UX)

1. **Sorteio:** animação de "tirar ficha" (números 1..N) com semente do servidor.
2. **Draft de terreno:** tela com os terrenos (N+1 se N<6). Cada um mostra grade, traço, fraqueza e estilo. Na sua vez, o botão "Escolher". Terrenos escolhidos ficam acinzentados.
3. **Pacote de Posição:** tela de resumo do bônus que você recebeu.
4. **Rodada 1:** "Você joga primeiro" aparece se for o último a escolher.

---

## 10. Protocolo de mensagens (WebSocket, JSON)

```jsonc
// Cliente → Servidor
{ "t": "join", "room": "ABC123", "name": "Ana", "token": "opt" }
{ "t": "cmd",  "room": "ABC123", "seq": 42, "cmd": { "type": "BUILD", "cardId": "c17", "tileId": "B3" } }
{ "t": "ping" }

// Servidor → Cliente
{ "t": "joined", "playerId": "p1", "token": "…", "state": { /* viewFor */ } }
{ "t": "events", "seq": 42, "events": [ /* filtrados */ ], "state": { /* viewFor */ } }
{ "t": "error",  "seq": 42, "code": "INSUFFICIENT_RESOURCES", "msg": "Faltam 🔨1" }
{ "t": "lobby",  "seats": [ /* … */ ], "host": "p1" }
{ "t": "pong" }
```

- `seq` evita comandos duplicados (idempotência); o servidor ignora `seq` já processado.
- **Reconexão:** o cliente envia o último `seq` recebido; o servidor reenvia o estado atual + eventos faltantes.
- **Compressão:** `permessage-deflate`. Estado completo só no `join` e em *resync*; depois, eventos (diffs).

---

## 11. UI/UX

### 11.1 Telas

1. **Home:** Nova partida · Entrar com código · Regras · Cartas (galeria).
2. **Lobby:** assentos, convite, configurações.
3. **Draft:** carrossel de terrenos.
4. **Mesa de jogo:** ver wireframe abaixo.
5. **Fim:** pódio, gráfico de ⭐ por fonte por rodada, replay.
6. **Galeria/Regras:** cartas com filtros, FAQ.

### 11.2 Wireframe da mesa (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Rodada 6/…  Evento: Onda de Calor   Auditoria: Maior excedente de 💧      │
│ ⭐ Trilha:  Ana ●6 ─ Bruno ●5 ─ Carla ●3 ─ Davi ●2     🔔 Tensão 4        │
├───────────────┬──────────────────────────────────────┬───────────────────┤
│ OUTROS        │            SUA CIDADE (4×4)           │ MERCADO           │
│ Bruno 😊6 💰2 │  ┌────┬────┬────┬────┐               │ Padrão: [L][Li][E][Lo]│
│ Carla 😊4 💰0 │  │ O  │ O  │ O  │ O  │  ⚡3/4 💧2/3   │ Fila: [ ][ ][ ][ ][ ][ ]│
│ Davi  😊7 💰1 │  ├────┼────┼────┼────┤  👥12  ☁️3     │ Obras: [M][M][M]   │
│ (grades em    │  │ ·  │ P  │ H  │ ·  │  😊6  Tesouro 2│ Metas: [G][G][G][G][G]│
│  miniatura)   │  ├────┼────┼────┼────┤               │ Facções 🔧🌿💼✊    │
│               │  │ ·  │ ▢  │ ▢  │ ·  │               │                   │
│               │  └────┴────┴────┴────┘               │                   │
├───────────────┴──────────────────────────────────────┴───────────────────┤
│ SUA MÃO:  [💰][💰][🔨][Lote][Lobby]     Pool: 💰4 🔨1 🗳️0   [Fim do turno]│
└──────────────────────────────────────────────────────────────────────────┘
```

**Princípios de UI:**
- **Preview de custo** ao passar o mouse: mostra o que muda (⚡/💧/👥/☁️/Renda) antes de confirmar.
- **Destaque de adjacências:** ao arrastar uma carta sobre a grade, as casas vizinhas pulsam e mostram bônus.
- **Ações legais em destaque:** o servidor envia `getLegalCommands` e o cliente desabilita o resto.
- **Log de eventos lateral** com filtros ("meu turno", "outros", "Fiscalizações").
- **Desfazer local** só antes de confirmar; **sem undo** após ação que revela informação.
- **Atalhos:** `E` fim de turno, `1–5` jogar carta na mão, `B` modo construir.
- **Acessibilidade:** contraste, ícones + texto, navegação por teclado, modo daltônico (padrões, não só cores), tamanhos de fonte.
- **Mobile:** layout vertical com abas (Cidade / Mercado / Outros / Log); mão em "leque" na base; toque longo para zoom da carta.

### 11.3 Animações e sons
- Cartas voando da mão para a grade; recursos "flutuando" ao serem ganhos.
- Fiscalização: sacola balançando, cubos saindo um a um, pausa dramática.
- Sons curtos (opcional, mute global).

---

## 12. Persistência e deploy

| Item | Proposta |
|---|---|
| **Estado da partida** | Snapshot a cada fim de turno + **log de comandos** (permite replay) |
| **Banco** | SQLite no início (arquivo no volume Docker); Postgres ao escalar |
| **Contas** | Convidado por padrão; login por **link mágico/Google** depois, para histórico/estatísticas |
| **Hospedagem** | VPS pequeno (2 vCPU/2 GB) suporta centenas de salas simultâneas (o motor é leve) |
| **Proxy** | Caddy/Nginx com TLS; `Upgrade: websocket` habilitado |
| **Subdomínio** | `jogo.seusite.com` aponta para o servidor; o site principal só linka |
| **CORS/Origin** | Validar `Origin` no WebSocket; liberar só seu domínio |
| **Escala horizontal** | Uma sala = um processo "dono"; roteamento por hash do código; Redis para localizar a sala |
| **Backups** | Dump diário do banco; logs de partida compactados |
| **Observabilidade** | Logs estruturados, métricas (salas ativas, latência), Sentry no front/back |

**Se o seu site for estático (GitHub Pages/hosting simples):** hospede só o front lá; o servidor Node roda em VPS/Fly.io/Render. **Se o site for WordPress/PHP:** incorpore o jogo via `<iframe>` ou página dedicada; o resto é independente.

---

## 13. Segurança e anti-trapaça

1. **Cliente não confiável:** toda regra é validada no servidor.
2. **Rate limiting** por conexão e por IP (comandos, criação de sala, chat).
3. **Tokens** de jogador longos e aleatórios; nunca no URL.
4. **Sanitização** de nomes/chat (sem HTML); limite de comprimento; filtro de palavrões opcional.
5. **Sem vazamento por timing:** respostas de reações com atraso uniforme.
6. **Sementes e embaralhamentos** gerados no servidor; o cliente nunca sorteia.
7. **Logs** não guardam IP além do necessário (LGPD): apelido + token anônimo.
8. **Limites de sala:** máx. 6 jogadores + 20 espectadores; tamanho de mensagem.

---

## 14. Bots

| Bot | Uso | Estratégia |
|---|---|---|
| **Aleatório** | Testes | Ação legal aleatória |
| **Guloso** | Fácil | Maximiza PU imediato (`07 §7`) |
| **Planejador** | Médio | Escolhe um "arquétipo" por terreno e persegue Metas/Facções |
| **Arriscado** | Difícil | Aceita corrupção e Obras-Prima cedo |
| **MCTS leve** (opcional) | Avançado | Simula N jogadas com o motor puro |

Bots **usam o mesmo motor** e os mesmos comandos de um humano. Eles também ocupam assentos quando alguém cai (AFK).

---

## 15. Testes

| Tipo | Ferramenta | Exemplos |
|---|---|---|
| Unitários de regras | Vitest | Construção, adjacência, déficits, Fiscalização |
| Propriedades | fast-check | "Nunca ter ⭐ < 0", "descartes + mão + deck + exilados = total", "Tesouro ≤ máx." |
| Replay dourado | Vitest | Partidas gravadas (semente + comandos) devem gerar o mesmo estado final |
| Simulação em massa | `packages/sim` | 10k partidas; relatórios de balanceamento |
| E2E | Playwright | Criar sala → convidar → jogar rodada |
| Carga | k6 | 200 salas simultâneas |

---

## 16. Telemetria para balanceamento

Eventos anônimos por partida: terreno/assento, rodadas, ⭐ por fonte, cartas compradas/construídas, Fiscalizações, Investigações, tempo por turno, quem abandona e quando, e **vitórias por combinação** (terreno × primeira Facção). Painel simples (Metabase/Grafana) com os alvos de `08 §5`.

---

## 17. Roadmap (fases e entregáveis)

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0 — Design** | Estes .md + planilha de cartas | Revisão e congelamento v0.1 |
| **1 — Motor** | `engine` com testes (sem UI) + simulação com bots | Partida completa 4 bots sem erros; relatório inicial de balanceamento |
| **2 — Hotseat** | UI mínima (grade, mão, mercado) num navegador, 1 máquina | Dá para jogar uma partida inteira sozinho/hotseat |
| **3 — Multiplayer** | Servidor, salas, convite, reconexão, bots, timers | 4 amigos jogam por link |
| **4 — Polimento** | Animações, som, tutorial interativo, mobile, acessibilidade | Playtest cego com 10 grupos |
| **5 — Beta aberto** | Contas opcionais, histórico, replays, galeria de cartas | Taxa de término > 80% |
| **6 — Conteúdo** | Novos terrenos, Prefeitos com poderes, Eventos (`10`) | Roadmap de expansões |

**Estimativa grosseira (1 dev full-stack):** Fase 1: 2–3 semanas · Fase 2: 2 semanas · Fase 3: 2–3 semanas · Fase 4: 3 semanas. Total para um MVP jogável online: **~2,5–3 meses**. Com **boardgame.io** a fase 3 pode cair para ~1 semana.

---

## 18. Riscos técnicos e mitigação

| Risco | Mitigação |
|---|---|
| Regras muito densas para UI | Prévia de custos, tutorial guiado, "assistente de turno" |
| Bugs de adjacência/derivados | Derivar tudo em funções puras + testes de propriedade |
| Latência / queda | Reconexão por `seq`; timers com banco de tempo |
| Balanceamento tardio | Simulador desde a Fase 1 |
| Conteúdo (cartas) mudando sempre | Dados em JSON + schema + versão (`dataVersion` no estado) |
| Escopo (6 terrenos + 60 cartas) | MVP com 2 terrenos e Tier I/II; adicionar o resto depois |

---

## 19. Próximos passos práticos

1. Confirmar a stack do seu site e onde hospedar o servidor.
2. Montar a **planilha mestre de cartas** a partir de `05`, `06`, `07` e `04`.
3. Escrever o `engine` com **2 terrenos (Litoral, Montanha)**, deck básico/padrão e Tier I.
4. Rodar a primeira simulação de 1.000 partidas e comparar com `08 §5`.
5. Subir o hotseat e testar com 2–3 pessoas.
