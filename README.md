# Lucas Oliveira — Portfolio

Source code for my professional portfolio: a single-page React app showcasing
Engineering and Software projects, with a bilingual (PT/EN) UI and a small blog.

## Stack

React 19 + Vite, React Router, i18next. No backend — project and blog content
are static data modules bundled with the app.

## Structure

```
frontend/
├── src/
│   ├── pages/       ← Home, About, Projects, ProjectDetails, Blog, BlogPost
│   ├── components/  ← Navbar, Hero, About, ProjectCard, ProjectGrid, Footer
│   ├── data/         ← projects.js (project catalog), posts.js (blog posts)
│   ├── i18n/         ← PT/EN translations
│   └── App.jsx
└── public/           ← images, PDFs (docs), static assets
```

Adding a project means adding an entry to `frontend/src/data/projects.js`
(`localizeProject` handles the `_en` suffix fields automatically) — pages
render from that data, nothing else needs to change.

## MANDATO (jogo — página independente)

Jogo de deck building + construção de cidade, definido em `MANDATO/` (documentos 00–11).
É uma **aplicação separada do portfólio**: tem o próprio HTML (`frontend/mandato/index.html`), CSS, fontes e
identidade visual, sem o header/footer do portfólio. Em desenvolvimento abre em `http://localhost:5173/mandato/`;
no build vira `dist/mandato/` (Vite multi-page).

```
frontend/
├── mandato/index.html          ← entrada própria do jogo
├── public/mandato/art/         ← arte das cartas (recortada de MANDATO/images)
└── src/mandato/
    ├── data.js                 ← cartas, terrenos, metas, rodadas, exploração (transcritos de MANDATO/02–07)
    ├── engine.js               ← motor de regras puro (roda no navegador e no Node)
    ├── bot.js                  ← GreedyBot (preenche assentos e roda simulações)
    └── ui/ + mandato.css       ← interface no estilo do guia visual (MANDATO/11)
```

Modos: **Solo contra o Rival** (doc 10), **partida local** de 2 a 6 prefeitos (humanos com cortina de
privacidade + bots) e **online** com salas (abaixo).

**Mesa principal:** a tela de jogo é uma mesa compartilhada. No centro ficam as Metas (com quem pegou Ouro/Prata)
e as Facções (posição de todos os jogadores); abaixo, a cidade de **todos** os prefeitos ao mesmo tempo, com
medidores, Gabinete, Mérito e os recursos de quem está na vez. A ordem de turnos da rodada aparece no topo e os
bots jogam **um de cada vez**, à vista, com um resumo da jogada. Cada jogador age só na sua cidade; clicar num
edifício de outro jogador mostra a carta no Inspetor.

**Online com amigos (salas e convite):** na home, *Jogar online* → *Criar sala*. A sala tem um código de 6
caracteres e um link de convite (`/mandato/?sala=ABC123`); o anfitrião adiciona bots, escolhe a duração e inicia.
O servidor (`frontend/server/`, Node + `ws`) é autoritativo: roda o mesmo motor de regras, só aceita comando de
quem está na vez e envia a cada jogador apenas o que ele pode ver (mãos dos outros, ordem dos decks, baralhos de
mercado/metas/rodadas e a semente ficam no servidor — ver `src/mandato/online/view.js`). Quem cai volta ao mesmo
assento sozinho (recarregar a página, queda de rede); quem fecha a aba volta pelo botão **Voltar para a sala**
(o lugar fica guardado no navegador por 7 dias) ou abrindo de novo o link de convite. Se alguém sumir de vez,
o anfitrião troca o lugar por um bot.

As salas são gravadas em arquivo (`MANDATO_DATA_FILE`, padrão `frontend/data/rooms.json`) e restauradas quando o
servidor sobe, e os jogadores reconectam sozinhos. Para sobreviver a **novos deploys** na Railway, anexe um
**Volume** ao serviço (ex.: montado em `/data`) e defina `MANDATO_DATA_FILE=/data/rooms.json`; sem volume, o
arquivo some a cada deploy (reinícios simples do mesmo contêiner ainda restauram).

```
npm run build && npm start      # produção: serve o site + o WebSocket (/mandato/ws) na porta PORT
npm run server                  # desenvolvimento: só o WebSocket (porta 8787); rode junto com `npm run dev`
npm run test:online             # teste de integração com clientes WebSocket de verdade
```

Deploy (Railway): o serviço precisa rodar o **servidor Node**, não só arquivos estáticos. Build: `npm run build`
(em `frontend/`); Start Command: `npm start` (em `frontend/`; a partir da raiz do repositório, `npm start` também
funciona). O WebSocket usa a mesma porta e o mesmo domínio do site (`wss://lucasoliverno.com/mandato/ws`).

**Na mesa online:** o centro da mesa (Metas e Facções) recolhe com um clique, a sua cidade aparece primeiro e cada
prefeito mostra a última jogada. A decisão de outro jogador vira um aviso no topo, sem modal, e só quem decide vê a
janela de escolha. Fora da sua vez a mão recolhe para sobrar espaço para a mesa. Há aviso sonoro de "sua vez" (🔔 no
topo), conversa da sala (na sala de espera e na aba Conversa), revanche na mesma sala e confirmação ao sair. Se o
mesmo lugar for aberto em outra aba, a aba antiga para de reconectar em vez de disputar o lugar.

**Balanceamento v1.1** (medido com `npm run sim:mandato -- <partidas> <jogadores>`; `DRAFT=random` mede só os terrenos):
- Prefeitura rende 💰1 **e 🔨1**: sem isso as obras travavam o começo (0,2 edifício por jogador na rodada 3).
- Pacote de Posição só com Tesouro e calibrado por número de jogadores (`PACKAGES_BY_N` em `data.js`). Jogar primeiro
  na rodada 1 já vale ~10 pp; com o pacote antigo (😊 e cartas extras) o último assento chegava a 43% de vitória.
- Montanha: ⚡ inicial 4→3 e Jazida rende 💰1 em vez de 🔨1. Planície: ⚡ inicial 2→3 e Explorar por 💰2.
  Litoral: VER na Orla também rende 💰1.
- Os bots escolhem terreno por preferência (`DRAFT_RANK` em `bot.js`), como numa mesa real.
- Resultado com o GreedyBot (300–500 partidas): vitória por assento 2p 51/49, 3p 37/29/34, 4p 22/21/31/27,
  6p entre 13% e 22%; terrenos entre 0,8× e 1,3× a média; o vencedor termina com ⭐8 em média.
- Ainda abaixo da meta do doc 08: Fiscalizações (~3 por partida, meta 6–9), peso das Obras-Prima (~37% do mérito,
  meta 20–25%) e Crises (~1,4 por partida). Vale confirmar tudo com partidas de humanos.

**Clareza e ajustes v1.2** (a partir de playtest):
- Tutorial guiado (botão na tela inicial e no topo da mesa), glossário de siglas nas Regras, Saco clicável com
  explicação e o sorteio animado a cada Fiscalização, Auditoria com quem lidera agora, ver deck e descarte,
  👁 para ampliar qualquer carta do mercado (o Loteamento mostra as 5 opções de Zona), Meta clicada no centro da
  mesa abre os detalhes no Inspetor, sons sintetizados (moeda, carta, obra, sino, fanfarra; 🔔 silencia) e
  confirmação ao encerrar o turno com recursos, cartas ou Metas pendentes.
- Projetos Regionais: os 3 edifícios do seu terreno (Balsa, Poço do Oásis…) estão sempre à venda para você
  (💰3 + 🗳️1, 1 de cada), sem depender da Exploração; cada Meta Regional explica como ser cumprida.
- A Fila Especial gira 1 carta por rodada (sem disparar Fiscalização), e há mais Loteamento com mais jogadores.
- Terrenos: Planície com lote −🔨1 e 💧4; Ilha só paga logística em IND; Mina de Cobre rende 🔨1; regionais da
  Floresta, Planície e Deserto ajustados.

**Ajustes v1.3** (simulação, draft aleatório 6p e por preferência 3p/4p): 😊 inicial 5→6 (menos Crises de Governo);
Montanha perde a renda extra da Jazida (era a causa da força: 1,42× → 1,09×); Planície ganha o bairro-jardim (RES vizinho
de VER rende +💰1) e Meta Regional mais alcançável (👥12, 😊7, ☁️3), de 0,48× para ~1,0×; desmatar a Floresta não põe mais
cubo no Saco. Terrenos agora entre 0,73× e 1,27× da média; pacotes de 3p e 4p recalibrados.

**Ajustes v1.4:** pilha de Loteamento com 8 por jogador + 4 (antes acabava na rodada 2–3; agora dura até ~5–7);
Floresta ganha a Ecovila (o Loteamento entra em Floresta sem desmatar); a Ilha não paga mais logística. Os bots passaram a
evitar déficit de ⚡/💧 e poluição alta: as "Crises de Governo" da simulação eram falha de estratégia do bot (caíram de ~2,2
para ~0,2 por partida). Resultado: assentos 22–28% em 4p, terrenos entre 0,6× e 1,3× da média.

**Jogo de cidade v1.5** (a partir de playtest: "o jogo está focado em Metas e não em construir a cidade"):
- **Sem Eventos de Rodada:** a carta de Rodada só traz a Auditoria. Em simulação os eventos não ajudavam o balanceamento,
  só desequilibravam terrenos (diferença melhor/pior: 0,57 com eventos, 0,21 sem).
- **Partidas maiores:** Curto ⭐12/12 rodadas, **Padrão ⭐16/16**, Épico ⭐20/20 (`DURATIONS` em `data.js`; solo segue ⭐10/12).
- **Comprar terreno até 5×5** (`landSlots`, `landCost`, comando `land` no motor): 1 por turno, vizinho da cidade, 💰3 +💰1 por
  compra; a casa nova segue o mapa (`landKind`). Botão **🗺️ Comprar terreno** no painel da sua cidade; as casas à venda
  aparecem nas três visualizações (Mesa 3D, Cidades 2.5D e Grade 2D).
- **Marcos da Cidade** (`CITY_MARKS`): ⭐1 cada, uma vez — 8/12/16 edifícios, 👥 6 e 👥 10, 5 Zonas diferentes.
- Resultado (bots, draft aleatório, 4p): Mérito vem 27% da cidade, ~30% de Metas (antes 47%), 20% Obras-Prima; assentos 22–28%
  (5p 18–24%, 6p 14–20%); terrenos entre 0,78× e 1,24×; ~45% das partidas acabam por alguém chegar à meta.
- Ajustes: Ilha (Prefeitura +🔨1, Loteamento 💰1, terreno −💰1), Montanha (Prefeitura +💰1), Deserto (Loteamento INF ⚡+2),
  pacotes de 4–6 jogadores e ranking de draft dos bots. Os bots compram terreno quando a grade enche.
- Limitação conhecida: os bots não perseguem 👥, então Metrópole/Bairro Planejado e as Metas Regionais de Planície e
  Floresta quase não saem em simulação (são possíveis para humanos).

**Arte das cartas:** as folhas geradas por IA ficam em `MANDATO/images/` (ordem e prompts em
`MANDATO/12_guia_de_prompts_ia.md`). `frontend/scripts/slice-art.mjs` recorta cada folha em uma imagem por ID
(`public/mandato/art/<ID>.webp`: edificações, regionais, administração, básicas/padrão, decretos, intrigas,
obras-prima, 60 cartas de exploração, Metas, Rodada, emblemas das Facções e os mapas dos terrenos `T-*`) e gera
`src/mandato/artManifest.js`. Para refazer: `cd frontend && npm i --no-save sharp && node scripts/slice-art.mjs`.
O retrato extra do Tier III (homem da tesoura) e os ícones gerados ficam de fora (os ícones do jogo são SVG).
O favicon do jogo também sai desse script (`public/mandato/favicon.png`).

**Mesa 3D (estilo Tabletop Simulator):** visualização padrão da partida (`src/mandato/ui/Table3D.jsx`, Three.js via
`@react-three/fiber` + `drei`, carregada sob demanda). Uma mesa de madeira com o tabuleiro central (cartas de Meta com os discos
de Ouro/Prata, trilhas das Facções com o cubo de cada jogador e a Fila Especial) e a cidade de cada prefeito em volta, com os
prédios modelados no Blender (`public/mandato/models/mandato.glb`, ~560 KB com gzip, gerado por
`build_sprites.py -- --glb`). Arrastar gira a câmera, botão direito move, roda aproxima; atalhos **Minha cidade / Centro /
Mesa toda**. Clicar numa casa constrói ou inspeciona, prédios novos caem do céu, deck e descarte de cada um ficam ao lado da
cidade e a mão aparece em leque por cima da mesa. O seletor no topo troca para **Cidades 2.5D** ou **Grade 2D**.

**Cidade 3D (2.5D isométrica):** as cidades da mesa são montadas com sprites renderizados no Blender. O script
`MANDATO/3d/build_sprites.py` modela, de forma procedural e na paleta do guia visual, os 62 edifícios (todas as
edificações, Obras-Prima, regionais e as 5 Zonas do Loteamento) e os 11 tipos de chão (Plano, Orla, Encosta, Jazida, Rio,
Duna, Oásis, Floresta, desmatada, Costa), e grava `public/mandato/iso/<ID>.webp` (~0,5 MB no total). Todos usam o mesmo
enquadramento (câmera ortográfica 60°/45°, 320×480, centro da casa em 50%/80%), então o jogo só empilha as imagens
(`src/mandato/ui/iso.js` + `IsoCity` em `board.jsx` + `iso.css`). O botão **Grade 2D / Cidade 3D** no topo da mesa troca a
visualização (fica salvo no navegador). Para refazer os sprites (todos ou só alguns IDs):

```
blender --background --factory-startup --python MANDATO/3d/build_sprites.py [-- PREF E1-01 g-O]
```

`MANDATO/3d/build_prototype.py` gera a cena de prova do Litoral (`.blend`, `.glb` e renders).

Decisões de implementação onde o texto dos documentos é ambíguo:
- RD-03 (Onda de Calor): Deserto e Planície perdem 💧3 (o doc cita −2 no evento e −3 no terreno Planície).
- Rival (solo): ao tomar a vaga Ouro de uma Meta ele não ganha o ⭐1 extra, para respeitar o ritmo da tabela
  de dificuldades (sem isso o Veterano/Mestre terminam por volta da rodada 6).
- Balsa Rápida liga a ilha onde foi construída à Ilha Principal (ou, na principal, à próxima ilha ainda isolada).
- "Req 👥" de Obras-Prima é requisito para construir; nos demais edifícios, deixa o edifício inativo.
- Só os 17 edifícios dos Tiers I e II têm arte final; as demais cartas usam ilustração SVG provisória.

Testes e simulação (a partir de `frontend/`):

```bash
npm run test:mandato                      # 13 cenários de regras (construção, Fiscalização, Intrigas, Facções, Metas…)
npm run sim:mandato -- 300 4              # 300 partidas só com bots, 4 jogadores (métricas do doc 08 §5)
npm run sim:mandato -- 100 1 solo veterano   # modo solo contra o Rival
```

## Setup & Running

```bash
npm install --prefix frontend
npm run dev       # http://localhost:5173
npm run build      # production build
npm run preview    # preview the production build
```

The root `package.json` is a thin wrapper that forwards `dev`/`build`/`preview`
into `frontend/` via `--prefix`, so these can also be run directly from
`frontend/`.

## Featured Projects

| Project | Category | Stack |
|---|---|---|
| TEP-Sentinel | Engenharia | PyTorch/TensorFlow, Stable-Baselines3, Gemini, LangChain |
| HydroCalc Pro | Engenharia | Python, Streamlit, Plotly, Gemini |
| IndustrialEco | Engenharia | Python/FastAPI, Next.js, NumPy/SciPy |
| SGCA | Programação | Java 21, DDD, Clean Architecture |
| AI Data Bridge | Programação | FastAPI, Next.js, Vanna.ai (LLM+RAG), PostgreSQL |
| VoxFinance | Programação | Next.js, FastAPI, Llama 3.1, Deepgram |

Full list, descriptions, and galleries live in `frontend/src/data/projects.js`.
