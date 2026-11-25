# 13 — Proposta: Gestão & Inteligência (construções de deck-builder e de interação)

> Status: **no jogo (v1.7).** As 10 construções entram na Fila Especial (Tiers I–III) e as 3 Obras-Prima na vitrine.
> Arte das cartas recortada das folhas do §5; modelos 3D e sprites gerados pelo chat do Blender (§6). As habilidades
> aparecem como botões no painel da sua cidade (comprar carta, espionar) e no Inspetor da carta da mão (trocar, vender).

## 1. O problema e a ideia

Hoje o deck só **gera recursos**: quase todas as cartas são "💰/🔨/🗳️ +N", só 5 compram carta, nada limpa o deck e
nenhuma construção mexe nas cartas. Falta o "motor" de deck-builder (comprar, ciclar, enxugar) e falta interação.

A ideia é colocar esses poderes **nas construções**: o que você constrói define a sua estratégia. São 10 construções
novas (Tiers I–III, entram na Fila Especial) e 3 Obras-Prima novas. Elas formam quatro estilos de jogo:

| Estilo | Construções | Como joga |
|---|---|---|
| **Máquina de cartas** | Biblioteca de Bairro, Cartório Digital, Data Center | mão maior e mãos melhores todo turno |
| **Deck enxuto** | Bolsa de Valores, Arquivo Nacional | tira as cartas fracas (💰1) do deck e vira dinheiro |
| **Rede de Administração** | Agência de Empregos, Escola de Gestão, Gráfica Oficial | Administração mais barata e que rende mais |
| **Espionagem e defesa** | Agência de Inteligência, Inteligência Nacional, Corregedoria, Imprensa, Rede de TV | joga cubos dos rivais no Saco, lucra quando eles são pegos, ou se protege |

## 2. As cartas

### 2.1 Construções (Fila Especial)

| ID | Nome | Zona | Facção | Custo | Obra | Efeito |
|---|---|---|---|---|---|---|
| S1-01 | Biblioteca de Bairro | SER | 🔧 | 💰3 | 🔨2 | No seu turno (1×), pague 🗳️1: compre 1 carta. Cons ⚡1. |
| S1-02 | Cartório Digital | INF | 🔧 | 💰3 | 🔨2 | No seu turno (1×): descarte 1 carta da mão e compre 1. Cons ⚡1. |
| S1-03 | Agência de Empregos | SER | ✊ | 💰3 | 🔨2 | A 1ª Administração que você jogar em cada turno rende +💰1. |
| S2-01 | Agência de Inteligência | SER | 💼 | 💰5 | 🔨3 | Req 👥4. No seu turno (1×): um rival à sua escolha adiciona 1 🕵️ ao Saco. Cons ⚡1. |
| S2-02 | Corregedoria Municipal | SER | 🌿 | 💰4 | 🔨2 | Fim de cada rodada: remova 1 🕵️ seu do Saco. A Inteligência dos rivais não te alcança. |
| S2-03 | Escola de Gestão Pública | SER | 🔧 | 💰5 | 🔨3 | Req 👥4. Renda 🗳️1. Ao construir: ganhe de graça a Administração mais barata da Fila Especial. |
| S2-04 | Gráfica Oficial | COM | 💼 | 💰5 | 🔨3 | Req 👥4. Renda 💰1. Administração custa −💰2 para você (mín. 1). Cons ⚡1. |
| S3-01 | Data Center Municipal | INF | 🔧 | 💰7 | 🔨3 | Você compra +1 carta no fim do turno. Cons ⚡2. |
| S3-02 | Imprensa Investigativa | COM | 🌿 | 💰6 | 🔨3 | Req 👥6. Renda 💰1 🗳️1. Quando a Fiscalização sortear cubos de um rival, ganhe 💰2 por cubo no Tesouro (máx. 💰4 por sorteio). |
| S3-03 | Bolsa de Valores | COM | 💼 | 💰7 | 🔨3 | Req 👥8. Renda 💰2. No seu turno (1×): exile 1 carta da mão e ganhe 💰3. Cons ⚡1. |

### 2.2 Obras-Prima (vitrine; ⭐2 como as outras)

| ID | Nome | Facção | Custo | Efeito |
|---|---|---|---|---|
| M-13 | Agência Nacional de Inteligência | 💼 | 💰6 🔨4 🗳️3 | Renda 🗳️1. No seu turno (1×): um rival adiciona 1 🕵️ ao Saco. A Inteligência dos rivais não te alcança. |
| M-14 | Arquivo Nacional | 🔧 | 💰6 🔨4 🗳️2 | No seu turno (1×): exile 1 carta da mão e ganhe 💰3. |
| M-15 | Rede Nacional de TV | 🌿 | 💰6 🔨4 🗳️3 | Renda 🗳️1. Fim de cada rodada: se 😊 ≤ 6, +1 😊. Quando a Fiscalização sortear cubos de um rival, ganhe 🗳️1 por cubo. |

> A Grande Biblioteca (M-06), que já existe, é a Obra-Prima da "máquina de cartas" (+1 carta no fim do turno).
> M-14 e a Bolsa de Valores têm o mesmo poder de "vender carta": se quiser diferenciar, o Arquivo Nacional pode virar
> "exile 1 carta da mão e compre 1" (não testado).

## 3. Testes (bots, 4 jogadores, draft aleatório)

**Teste de potência:** em cada partida um assento (que gira) recebe a carta extra na mão na rodada 1; mede-se quantas
vezes ele vence. Para comparar, o **controle** é receber um Loteamento extra. Obras-Prima começam já construídas (com o ⭐2)
e são comparadas com duas que já existem. 300–400 partidas por carta.

| Carta | Rodada 1 | Final | Observação |
|---|---|---|---|
| *Controle: Loteamento extra* | 35% | 31% | referência para construções |
| Biblioteca de Bairro | **50%** | 38% | era "+1 carta por turno" por 💰3 — forte demais; virou "pague 🗳️1: compre 1" |
| Cartório Digital | 35% | 38% | |
| Agência de Empregos | 32% | 31% | |
| Agência de Inteligência | 21% | 33% | custava 🗳️1 e punha 🕵️ seu no Saco — fraca; agora é grátis |
| Corregedoria Municipal | 37% | 38% | |
| Escola de Gestão Pública | 28% | 33% | ganhou Renda 🗳️1 |
| Gráfica Oficial | 25% | 34% | desconto de −💰1 → −💰2 |
| Data Center Municipal | 39% | 37% | testei com exílio (44%) e com Req 👥 (22–24%); ficou só "+1 carta" |
| Imprensa Investigativa | 20% | 32% | ganho por cubo pego dobrou e ganhou Renda 💰1 |
| Bolsa de Valores | 26% | 28% | vender carta 💰2 → 💰3 |
| *Controle: Ponte Estaiada (M-02)* | — | 36% | Obra-Prima comum |
| *Controle: Grande Biblioteca (M-06)* | — | 52% | Obra-Prima forte que já existe |
| Agência Nacional de Inteligência | 59% | 54% | com 2 espionagens por turno chegou a 60%; ficou 1× + Renda 🗳️1 |
| Arquivo Nacional | **67%** | 52% | "+1 carta e exílio" era demais; ficou só o exílio com 💰3 |
| Rede Nacional de TV | 59% | 39% | +1 😊 toda rodada era demais; agora só com 😊 ≤ 6 |

**Partida completa com tudo junto** (300 partidas): os bots usaram as habilidades ~8 vezes por partida (ciclar 3,5,
comprar 3,3, espionar 2,1, vender 1,1). Assentos ficaram entre 22% e 30% (sem as cartas: 19–28%). Duração e fim por
meta não mudaram (~14 rodadas, ~60%).

**Limites dos testes:**
- As construções de Tier II e III quase não aparecem na Fila a tempo de serem compradas pelos bots (2–5% e 0% dos
  jogadores as constroem numa partida normal); a força delas foi medida pelo teste de potência. Com pessoas, isso deve
  ser bem diferente — vale observar se a Fila Especial precisa girar mais rápido.
- A diferença entre terrenos subiu de ~0,55 para ~0,87 na partida completa; precisa de mais simulação para saber se
  é ruído ou se algum terreno combina demais com essas cartas.
- Bot não sente "graça": só pessoas vão dizer se ciclar/espionar é divertido.

## 4. O que precisa no jogo para entrar

- **Motor:** habilidades 1× por turno (`ability`: ciclar, comprar pagando, exilar/vender, espionar), mão maior
  (`handPlus`), bônus de Administração, desconto na compra, Corregedoria no fim da rodada, ganho quando um rival é
  pego na Fiscalização, Obras-Prima M-13 a M-15. Tudo isso já existe no protótipo.
- **Interface:** botões das habilidades no prédio (ou no painel da sua cidade) — "Ciclar carta", "Comprar 1 (🗳️1)",
  "Vender carta (+💰3)", "Espionar…" — com escolha da carta da mão ou do rival; aviso quando um rival espiona você.
- **Bots:** já sabem construir e usar (vender/exilar o Orçamento 💰1, ciclar carta que não dá para construir, espionar
  quem lidera).
- **3D/2.5D:** os 13 modelos eu faço no Blender (`MANDATO/3d/build_sprites.py`), no mesmo padrão dos atuais. Não
  precisa de prompt.

## 5. Arte das cartas (prompts) e onde colocar

Use o **Style Bible** e as **Sheet Rules** do `12_guia_de_prompts_ia.md` (§1) no começo de cada prompt, como nas outras
folhas. Salve as imagens em `MANDATO/images/` com os nomes abaixo (o script de recorte procura pelo nome).

### 5.1 Folha "Gestão e Inteligência" — 10 construções (grid 5×2, proporção 5:4)

**Arquivo:** `MANDATO/images/Folha Gestao e Inteligencia.png`

```
[STYLE BIBLE] [SHEET RULES: N=10, COLS=5, ROWS=2] Cell ratio 5:4.
Same isometric 3/4 view, same small square ground plate and same soft top-left light as the Tier I buildings sheet.
1. S1-01 Biblioteca de Bairro: small two-storey neighborhood library with tall arched windows, book-shaped bench
   outside, a few children with backpacks, warm reading lamps glowing inside. Teal and cream.
2. S1-02 Cartório Digital: compact modern registry office with a glass front, a row of tiny service counters visible
   inside, a large wall screen with abstract icons (no letters), stacked archive boxes being carried out. Navy and teal.
3. S1-03 Agência de Empregos: busy small public job center, short queue of tiny people with folders at the door, a
   pinboard with blank paper notes, mustard awning. Mustard and brick.
4. S2-01 Agência de Inteligência: discreet grey office building with tinted windows, rooftop satellite dishes and
   antennas, a black car parked in front, a single figure in a trench coat. Navy and plum, slightly mysterious.
5. S2-02 Corregedoria Municipal: sober stone government building with columns, a large magnifying-glass sculpture on
   the lawn, filing cabinets visible through the windows. Sage and cream, calm and upright.
6. S2-03 Escola de Gestão Pública: modern school building with a small auditorium wing, a lawn with a few students
   holding notebooks, a blank banner over the entrance (no text). Teal and sage.
7. S2-04 Gráfica Oficial: printing house with a big paper roll on a truck, chimney with soft steam, stacks of blank
   printed sheets and folders on pallets, a large printing press seen through the window. Brick and mustard.
8. S3-01 Data Center Municipal: windowless modern block with rows of glowing server racks visible through a glass
   side, cooling units on the roof, thick cables, faint teal glow. Navy and teal.
9. S3-02 Imprensa Investigativa: newspaper headquarters with a tall radio mast, a delivery van, stacks of blank
   newspapers, reporters with cameras at the door (no logos). Plum and cream.
10. S3-03 Bolsa de Valores: neoclassical stock exchange with a big blank ticker board (abstract lines only), bronze
   bull-like abstract sculpture, busy steps. Mustard and navy, prosperous.
```

### 5.2 Folha "Obras-Prima — Gestão e Inteligência" — 3 Obras-Prima (grid 3×1, proporção 5:4)

**Arquivo:** `MANDATO/images/Folha Obras-Prima Gestao.png`

```
[STYLE BIBLE] Add: epic golden-hour lighting, slightly heroic low angle, warm gold rim light.
[SHEET RULES: N=3, COLS=3, ROWS=1] Cell ratio 5:4.
1. M-13 Agência Nacional de Inteligência: imposing brutalist headquarters with a huge radar dome and antenna field,
   searchlights in the dusk sky, black cars at the gate, secretive and grand. Navy and plum with gold rim light.
2. M-14 Arquivo Nacional: monumental archive building with endless rows of shelves visible through tall glass walls,
   a grand staircase, archivists moving boxes on carts. Teal and cream, solemn.
3. M-15 Rede Nacional de TV: tall broadcast tower over a modern TV studio complex with satellite dishes, an outdoor
   stage with lights and cameras, a giant blank screen (no text). Sage and mustard, festive.
```

### 5.3 Depois de salvar

Eu acrescento as duas folhas no `frontend/scripts/slice-art.mjs` (recorte 5×2 e 3×1, mesmo tipo das Edificações e das
Obras-Prima) e rodo o script, que gera `frontend/public/mandato/art/S1-01.webp` … `M-15.webp`. Se a IA juntar células
ou colocar texto, refaça só a folha com problema (dicas no §2 do guia 12).

## 6. Modelos 3D (prompts para o chat do Blender)

Os modelos aparecem em dois lugares do jogo: na **Mesa 3D** (arquivo `frontend/public/mandato/models/mandato.glb`) e nas
**Cidades 2.5D** (sprites `frontend/public/mandato/iso/<ID>.webp`). Os dois saem do mesmo gerador. Faça primeiro a arte
das cartas (§5): ela serve de referência visual para cada modelo.

### 6.1 Instruções técnicas (cole no começo da conversa do Blender)

```
Projeto MANDATO — modelos 3D de construções para o jogo. Trabalhe no gerador que já existe; não crie outro pipeline.

ARQUIVOS
- Gerador: MANDATO/3d/revisao_visual/build_revision.py (funções de modelagem) usando os utilitários de
  MANDATO/3d/revisao_visual/baseline.py (importado como `k`: k.box/B, k.cyl/C, k.rod/R, k.cone, k.ball, k.dome,
  k.hcyl, block, gable, tree, solar, tank, container, bench, awning, planter, balcony, hvac, k.win_front, k.win_side,
  k.pad, k.flag). Reaproveite esses utilitários, como pref()/market()/tower() fazem.
- Cada construção é uma função Python sem argumentos que cria a geometria na origem. Registre todas no dicionário em
  apply(): k.BUILDINGS.update({... 'S1-01': biblioteca, ...}). O ID é o nome do nó no GLB e do sprite — não mude.
- Gerar: blender --background --factory-startup --python MANDATO/3d/build_sprites.py -- --glb   (atualiza o GLB)
         blender --background --factory-startup --python MANDATO/3d/build_sprites.py -- S1-01 S1-02 ...   (sprites)
  O Blender está em L:\Fake Desktop\blender-5.4.0-alpha+main.4f97ee24309d-windows.amd64-release\blender.exe.

PADRÃO (obrigatório, para encaixar no tabuleiro)
- 1 casa do tabuleiro = 2 m × 2 m. A construção fica centrada na origem e cabe em 1,8 m × 1,8 m. Chão em z = 0
  (não modele o chão da casa: ele já existe; uma calçada/base fina de até 0,05 m pode).
- Altura: Tier I até ~1,4 m, Tier II até ~2,2 m, Tier III até ~3,2 m, Obras-Prima até ~4,2 m (o sprite corta acima
  de ~4,5 m).
- Fachadas que a câmera vê: −Y (frente) e +X (lado direito). Portas, letreiros sem texto e detalhes vão nelas.
- Câmera do sprite: ortográfica, 60° de inclinação e 45° de giro; sol do alto-esquerda. Não mude.
- Cores só da paleta k.PAL (chaves: navy, cream, teal, mustard, brick, sage, plum, white, sand, glass, glassl, roof,
  stone, steel, dark, wood, gold, glow, panel, tree, tree2...). Cores chapadas, chanfro leve, nada de textura.
- SEM texto, letras, números, logos, bandeiras reais. Telas e placas ficam em branco ou com formas abstratas.
- Orçamento de triângulos (o GLB inteiro hoje tem ~200 mil): Tier I ≤ 4.000, Tier II ≤ 6.000, Tier III ≤ 8.000,
  Obra-Prima ≤ 9.000. Confira em MANDATO/3d/model_report.json depois de exportar.
- Estilo igual ao kit revisado (PREF, HOME, E1-02, E2-01...): miniatura de maquete, formas simples e legíveis de
  longe, um elemento-assinatura por prédio (é ele que faz o jogador reconhecer a carta na mesa).

ENTREGA
- 13 funções novas registradas em apply(), GLB exportado com --glb, 13 sprites gerados, report com triângulos.
- Me mostre um render de cada um (sprite) para aprovação antes de exportar o GLB final.
```

### 6.2 Os 13 modelos (um prompt por construção)

```
S1-01 Biblioteca de Bairro (Tier I, SER, ~1,2 m): sobrado de dois andares com três janelas altas em arco na
fachada −Y, porta central de madeira, telhado de duas águas em brick, uma pequena escada e um banco em forma de livro
aberto na calçada. Janelas com brilho quente (glow suave). Assinatura: as janelas em arco. Cores: teal e cream.

S1-02 Cartório Digital (Tier I, INF, ~1,0 m): prédio baixo e moderno, frente de vidro (glassl) mostrando três
balcões pequenos por dentro, uma tela grande na parede lateral +X com ícones abstratos (retângulos coloridos), pilha
de caixas de arquivo saindo pela porta. Assinatura: a parede de vidro com os balcões. Cores: navy e teal.

S1-03 Agência de Empregos (Tier I, SER, ~1,0 m): prédio de um andar com toldo mustard sobre a porta, fila de 4–5
bonequinhos simples (cilindro + esfera) na calçada, um quadro de avisos com papéis em branco na fachada.
Assinatura: a fila de pessoas. Cores: mustard e brick.

S2-01 Agência de Inteligência (Tier II, SER, ~1,8 m): bloco cinza discreto de três andares com janelas escuras
(glass), duas antenas parabólicas e um mastro de antena no telhado, um carro escuro parado na frente.
Assinatura: as parabólicas. Cores: dark, navy e plum.

S2-02 Corregedoria Municipal (Tier II, SER, ~1,5 m): prédio sóbrio de pedra com quatro colunas na frente,
escadaria, e no gramado uma escultura de lupa gigante (aro + cabo). Assinatura: a lupa. Cores: stone, sage e cream.

S2-03 Escola de Gestão Pública (Tier II, SER, ~1,6 m): prédio escolar em L com ala de auditório (telhado curvo),
pátio com dois bancos e duas árvores, faixa em branco sobre a entrada. Assinatura: o auditório curvo.
Cores: teal e sage.

S2-04 Gráfica Oficial (Tier II, COM, ~1,5 m): galpão de tijolo com telhado em shed (dente de serra), chaminé com
vapor branco suave, caminhão com uma bobina de papel gigante, pallets com pilhas de papel. Assinatura: a bobina de
papel. Cores: brick e mustard.

S3-01 Data Center Municipal (Tier III, INF, ~2,0 m): bloco moderno sem janelas na frente, lateral +X de vidro
mostrando fileiras de racks com luzinhas (glow), unidades de refrigeração e dutos no telhado, cabos grossos.
Assinatura: os racks iluminados. Cores: navy, teal e glow.

S3-02 Imprensa Investigativa (Tier III, COM, ~3,0 m): sede de jornal de três andares com um mastro de rádio alto
no telhado, uma van de reportagem, pilhas de jornais em branco e dois repórteres com câmera na porta.
Assinatura: o mastro de rádio. Cores: plum e cream.

S3-03 Bolsa de Valores (Tier III, COM, ~2,4 m): edifício neoclássico com seis colunas e frontão, um painel
eletrônico largo na fachada com linhas abstratas (sem números), escultura abstrata de touro em bronze (gold/copper)
na praça da frente. Assinatura: o painel e a escultura. Cores: mustard, navy e cream.

M-13 Agência Nacional de Inteligência (Obra-Prima, ~3,5 m): sede brutalista imponente (blocos de concreto em
balanço), uma cúpula de radar branca grande, campo de antenas, dois holofotes, portão com cancela e carros escuros.
Assinatura: a cúpula de radar. Cores: dark, navy e plum, com detalhes gold.

M-14 Arquivo Nacional (Obra-Prima, ~3,0 m): edifício monumental com paredes de vidro altas mostrando prateleiras
sem fim por dentro, grande escadaria na frente, dois carrinhos com caixas. Assinatura: as estantes vistas pelo vidro.
Cores: teal e cream, com gold.

M-15 Rede Nacional de TV (Obra-Prima, ~4,2 m): torre de transmissão alta e fina sobre um complexo de estúdios, duas
antenas parabólicas, palco externo com refletores e uma tela gigante em branco. Assinatura: a torre com luz no topo.
Cores: sage e mustard, com glow.
```

### 6.3 Ordem sugerida
1. Gerar as duas folhas de arte das cartas (§5) e me mandar para recortar.
2. No chat do Blender: colar §6.1 e depois os prompts do §6.2, de 3 em 3, aprovando os sprites.
3. Exportar o GLB e os sprites; eu ligo as cartas no jogo (motor, interface, bots).
