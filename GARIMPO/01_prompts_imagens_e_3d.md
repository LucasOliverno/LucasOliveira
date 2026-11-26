# GARIMPO — Prompts de Imagem e de Modelos 3D

Guia para outro chat ou outra ferramenta gerar a arte. Usa o mesmo fluxo do MANDATO (`MANDATO/12_guia_de_prompts_ia.md`):
**a IA gera só a arte, sem texto**. Moldura, nome, custo e regras são montados depois a partir do `00_design.md`.

```
Folha de arte (IA) → fatiar → arte por carta → + moldura/texto (dados) → carta pronta
Conceito (IA, vista ortográfica) → imagem-para-3D → limpeza no Blender → GLB único → mesa 3D
```

---

## 0. Direção de arte

**Em uma frase:** *miniatura de mesa pintada à mão, numa mina brasileira antiga, com a luz quente do lampião contra sombras frias de pedra.*

| Sim | Não |
|---|---|
| Low-poly estilizado, cara de miniatura de resina pintada | Fotorrealismo, horror pesado, sangue |
| Contraste: luz âmbar do lampião × sombra verde-azulada | Neon, gradiente arco-íris |
| Folclore brasileiro com humor leve (garimpeiros, mascates, benzedeira) | Masmorra medieval europeia, dragão, cavaleiros, elfos |
| Madeira escorada, trilhos, bateia, carbureto, lona | Logos, marcas reais, pessoas reais |
| Texto colocado depois por nós | Texto ou número gerado na imagem |

### Paleta
| Nome | Hex | Uso |
|---|---|---|
| Breu | `#1A1714` | Fundo, contornos, verso de carta |
| Terra | `#7A4A2B` | Rocha quente, madeira |
| Pedra | `#8C8577` | Rocha fria, tiles vazios |
| Ocre | `#C98A2E` | 🤝 Prosa, molduras |
| Ouro | `#E8B53A` | 🟡 Pepita, Relíquias, pontos |
| Cobre Oxidado | `#3E8C7E` | 🔦 Luz das sombras, interface |
| Brasa | `#D2482B` | 💥 Estrondo, 🌋, Mãe-do-Ouro |
| Lona | `#E9DFC8` | Papel das cartas, gutters das folhas |
| Água | `#2F5D7C` | Nível d'Água, 🫧 Fôlego |

**Cores dos jogadores:** Vermelho-urucum `#B8402E` · Azul-anil `#2E4F8C` · Verde-mata `#3F7A3A` · Amarelo-ipê `#E3B72B`.

---

## 1. STYLE BIBLE (cole no início de TODO prompt de imagem)

```
STYLE BIBLE: hand-painted tabletop miniature diorama of an old Brazilian gold
mine, stylized low-poly shapes with soft painted texture, warm amber lantern
light against cool teal-green rock shadows, gentle folk-tale humor, cozy
adventure mood (not horror). Earthy limited palette: soot black #1A1714,
earth brown #7A4A2B, stone grey #8C8577, ochre #C98A2E, gold #E8B53A,
oxidized copper teal #3E8C7E, ember red #D2482B, canvas cream #E9DFC8,
water blue #2F5D7C. Wooden mine supports, rails, carbide lamps, gold pans.
3/4 view. No photorealism, no gore, no medieval fantasy, no dragons.
```

### SHEET RULES (cole depois do Style Bible)
```
SHEET RULES: single image containing {N} fully separate illustrations in a
{COLS} columns x {ROWS} rows grid. Every cell has the same size. Cells are
separated by wide, even gutters of flat solid canvas cream #E9DFC8 with no
content in the gutters. Each illustration is its own isolated composition
with the main subject centered inside the middle 70% of its cell. NO text,
NO letters, NO numbers, NO logos, NO watermarks, NO signatures, NO frames,
NO borders, NO captions, NO real brands, NO real people.
```

**Negative prompt:** `text, letters, numbers, watermark, signature, logo, frame, border, caption, photorealistic, gore, blood, dragon, knight, medieval castle, overlapping cells, merged cells, extra cells`

**Dicas por ferramenta:** as mesmas do MANDATO. Midjourney `--style raw` e `--sref` com a primeira folha aprovada. GPT Image e Gemini: anexe a folha aprovada como referência ("same style as the attached sheet"). Gere de 6 a 9 cenas por folha, no máximo.

---

## 2. Folhas de arte das cartas (proporção de célula 4:5, retrato)

### 2.1 Folha-piloto: Baralho Inicial + Mercado Fixo (8 + 1 vazia, grid 3×3)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3, last cell left EMPTY cream] Cell ratio 4:5.
1. Lamparina: a small tin oil lamp with a single warm flame hanging on a wooden mine beam, soft glow on rock.
2. Barganha: two weathered hands shaking over a crate, a small cloth pouch of gold dust between them.
3. Picareta Gasta: an old chipped pickaxe leaning against a rock wall, worn wooden handle wrapped with rope.
4. Tropeção: a miner's boot catching on a rail tie, a bucket flying, pebbles bouncing, comic motion.
5. Lampião a Querosene: a brass kerosene lantern with a glass chimney, bright steady light filling a tunnel.
6. Cabo da Turma: a stocky cheerful mine foreman with a mustache and a helmet, sleeves rolled, holding a sledgehammer.
7. Mapa do Veio: a hand-drawn treasure-vein map on worn paper pinned to a beam, drawn as lines and dots only, no writing.
8. Rato-de-Mina: a chubby mischievous mine rat stealing a tiny gold nugget, whiskers lit by lamp light.
9. (empty)
```
> Aprovou essa folha? Use ela como referência de estilo (`--sref` ou imagem anexada) em todas as outras.

### 2.2 Ferramentas (9, grid 3×3)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 4:5.
1. Lanterna de Carbureto: a miner's carbide lamp with a hissing blue-white flame and a polished reflector dish.
2. Picareta de Aço: a shiny new steel pickaxe striking quartz, small sparks and rock chips.
3. Corda de Sisal: a coil of thick natural sisal rope tied to a wooden ladder going up a shaft.
4. Capacete Amassado: a dented old miner's helmet resting on a rock, with a small candle holder on top.
5. Dinamite: a bundle of red dynamite sticks with a lit fuse hissing, tense moment, lots of empty space around.
6. Bateia de Prata: a shallow silver gold pan full of water with glittering gold flakes, hands holding it.
7. Detector de Veio: a whimsical brass dowsing instrument with a needle and a small glowing crystal pendulum.
8. Carrinho Desgovernado: a wooden mine cart speeding down rails, ore flying out, motion lines in dust.
9. Mapa da Galeria Esquecida: an old leather scroll case opened on a crate, a glowing faint map of tunnels (lines only, no writing).
```

### 2.3 Companheiros (9 retratos, grid 3×3)
Adicione ao Style Bible: `Portraits: bust from the shoulders up, 3/4 view, fictional Brazilian characters of diverse ages, skin tones and genders, expressive faces, lantern rim light, plain dark rock background.`
```
[STYLE BIBLE + Portraits] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 4:5.
1. Seu Tião, o Guia: an elderly wise mine guide with a white beard, straw hat, carbide lamp, kind squinting eyes.
2. Dona Zefa, Cozinheira: a warm middle-aged camp cook with a headscarf, holding a steaming enamel coffee pot.
3. Mascate Ambulante: a smiling traveling peddler with a huge backpack full of pots, ribbons and trinkets.
4. Irmãos Ferreira: two burly sibling miners side by side, one tall one short, matching sledgehammers, grinning.
5. Moleque Ligeiro: a quick teenage runner with a bandana, mid-dash, holding a small lantern, playful expression.
6. Cantadeira de Moda: a singer with a viola caipira (country guitar), eyes closed, calming the tunnel with song.
7. Capataz Arrependido: a former harsh foreman, now humble, hat in hands, sad-but-kind face, old whistle around neck.
8. Benzedeira: an old folk healer with a sprig of rue herb and a rosary-like bead string (no religious symbols), gentle smile.
9. Contrabandista: a sly smuggler in a long coat, half in shadow, opening the coat to show hidden gold bars, wink.
```

### 2.4 Bichos + Perigos (9, grid 3×3)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 4:5. Creatures are spooky-cute, readable silhouettes, not gory.
1. Morcego-Vampiro: a big-eared vampire bat swooping from the tunnel ceiling, glowing amber eyes.
2. Aranha-Caranguejeira: a big hairy tarantula on a mine beam, fuzzy and almost charming, web catching lamp light.
3. Cobra-Cega: a pale blind cave snake (caecilian-like) emerging from a crack in the rock floor.
4. Lobisomem do Turno da Noite: a shaggy werewolf in a torn miner's shirt and helmet, under a ventilation shaft with moonlight.
5. Boitatá Filhote: a small baby fire serpent made of blue-orange flames with big eyes, coiled around a gold nugget.
6. Corpo-Seco: a dried-up wandering ghost figure made of twisted roots and dust, hollow glowing eyes, eerie but not gory.
7. Grisu: green-yellow toxic mine gas creeping along a low tunnel, a canary in a cage reacting in the foreground.
8. Infiltração: water spurting through cracks in a timber-lined wall, puddles rising around rails.
9. Rachadura: a deep glowing ember-red crack splitting the rock wall, dust falling, sense of something huge waking below.
```

### 2.5 Achados + Mascate (8 + 1 vazia, grid 3×3)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3, last cell left EMPTY cream] Cell ratio 4:5.
1. Pepita Encravada: a large gold nugget embedded in white quartz rock, glinting.
2. Fóssil de Preguiça-Gigante: a giant ground sloth fossil skull half-exposed in a cave wall, lantern light on it.
3. Diário do Engenheiro: an old leather notebook with sketches of beams and gears (drawings only, no writing), pencil, spectacles.
4. Ouro-de-Tolo: a cluster of shiny cubic pyrite crystals that look like gold, a miner's surprised reflection in it.
5. Capacete com Luz: a sturdy upgraded mining helmet with a bright electric headlamp, still life on a crate.
6. Corda Nova: a fresh coil of bright rope with a steel carabiner and a pulley.
7. Mochila: a big patched canvas backpack with straps, pans and a lantern tied to it.
8. Cantil de Ar: a metal canteen with a small brass air valve and bubbles drawn as soft glowing circles.
9. (empty)
```

### 2.6 Relíquias (7 + 2 vazias, grid 3×3, fundo escuro)
Usadas como arte das fichas e como **conceito dos modelos 3D** da seção 5.
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3, last two cells left EMPTY cream] Cell ratio 1:1.
Each relic is a precious object on a small stone pedestal, centered, soft golden glow, dark rock behind.
1. Bateia do Primeiro Garimpeiro: an ancient hammered gold pan with engraved spirals.
2. Lampião de Prata: an ornate silver lantern with a small eternal blue flame inside.
3. Sino da Capela Soterrada: a small bronze bell, green with age, with a carved vine pattern.
4. Coroa de Quartzo-Rosa: a crown of rough pink quartz points on a twisted gold band.
5. Ferradura de Ouro: a golden horseshoe with tiny embedded green stones.
6. Olho de Topázio: a large faceted yellow-orange topaz in a claw setting, glowing from inside.
7. Escama da Mãe-do-Ouro: a single huge shimmering scale, gold edges fading into ember red, warm glow.
8. (empty)
9. (empty)
```

---

## 3. Peças gráficas (sem grade)

### 3.1 Verso das cartas (2:3)
```
[STYLE BIBLE] Card back design, perfectly symmetrical: a coiled golden fire serpent
forming a circle around a crossed pickaxe and lantern, on soot black #1A1714 with
a thin ochre ornamental border of mine timbers. Flat, centered, print-ready.
NO text, NO letters.
```

### 3.2 Textura do tabuleiro em corte (16:9, use o maior tamanho que a ferramenta der)
```
[STYLE BIBLE] Orthographic side cross-section of a mountain cut in half, like a
dollhouse view, seen straight on (no perspective). Grassy surface with a small mine
entrance shack and an elevator headframe at the top. Below, five underground levels
stacked vertically, each a horizontal tunnel gallery with timber supports, zig-zagging (each level's main ladder down is on the opposite side from the one above): level 1
dusty brown, level 2 with a small underground peddler stall, level 3 darker with
teal shadows, level 4 with glittering crystal geodes, level 5 a vast glowing ember
cave chamber with a coiled sleeping gold-and-fire serpent silhouette in the rock.
Vertical ladders and two narrow shafts connect levels; mine cart rails run along
level 1 and 2, a small air vent with light coming down at the far left of level 1. Leave flat clear circular spots along the tunnels for game nodes (7 per level on levels 1 and 2, 6 on levels 3 and 4, 3 in the chamber).
NO text, NO numbers, NO icons.
```
> Os nós, números e ícones são desenhados por cima depois (posições vêm do `data.js`). Se a IA errar as galerias, gere cada nível separado em 16:3 e monte.

### 3.3 Ícones dos recursos (grid 4×3, fundo Lona, 1:1)
```
[STYLE BIBLE] [SHEET RULES: N=12, COLS=4, ROWS=3] Cell ratio 1:1. Flat bold game icons, thick dark outline, 2–3 colors each, readable at 32px.
1. Luz: a small carbide lamp flame (teal and amber).
2. Prosa: two hands shaking (ochre).
3. Picareta: a pickaxe (stone grey and earth brown).
4. Estrondo: a burst with flying rock chips (ember red).
5. Pepita: a gold nugget (gold).
6. Cristal: a pointed quartz crystal (teal-white).
7. Relíquia: a small ornate urn (gold).
8. Fôlego: three rising air bubbles (water blue).
9. Rachadura: a cracked rock with ember glow (ember red).
10. Pontos: a four-pointed star (gold).
11. Desabamento: a pile of fallen rocks blocking an arch (grey).
12. Grisu: a green gas cloud with a canary silhouette (yellow-green).
```

### 3.4 Tabuleiro pessoal (3:1)
```
[STYLE BIBLE] Wide player mat illustration: a wooden workbench seen from above with
a canvas cloth, an empty gold pan area on the left, a row of 10 empty circular
slots for air bubbles along the top edge, a rope-framed empty area on the right for
carried relics. Top-down orthographic. NO text, NO numbers.
```

### 3.5 Key art / capa da caixa (3:4)
```
[STYLE BIBLE] Key art: four fictional Brazilian miners of different looks (red, blue,
green and yellow scarves) running up a wooden ladder inside a mine, one clutching a
glowing relic, carbide lamps swinging, while below them a huge golden fire serpent
opens its eyes in an ember-lit cavern, water starting to rise in the tunnels.
Dynamic diagonal composition, empty space at the top third for the title.
NO text, NO letters.
```

---

## 4. Especificação técnica dos modelos 3D (vale para todos)

Cole este bloco junto com cada pedido de modelo:
```
TECH SPEC: stylized low-poly tabletop game miniature, hand-painted look, matching
the GARIMPO style bible palette. Export as GLB (glTF 2.0 binary). Y-up, 1 unit = 1 cm,
real tabletop size as listed. Origin/pivot at the center of the base, base resting
on Y=0. Single object, applied transforms, clean quads/tris, no hidden internal faces,
no floating parts. PBR metal-rough material, one texture atlas of 1024px (2048px for
the board and the boss), no baked shadows or lighting in the texture. Roughness high
(0.7–0.9) except metal parts. Name the object and the file exactly as the asset ID.
```

**Fluxo recomendado (imagem → 3D):**
1. Gere o **conceito** com o prompt de conceito abaixo (fundo neutro, vista ortográfica).
2. Mande o conceito numa ferramenta imagem-para-3D (Meshy, Tripo, Rodin, Hunyuan3D etc.) **ou** use o "Prompt 3D" direto em texto-para-3D.
3. Limpe no Blender: escala, pivô, decimação até o orçamento de triângulos, atlas e nome.
4. Junte tudo em `garimpo_modelos.blend` → exporta `garimpo.glb` (mesmo esquema do `MANDATO/3d/build_sprites.py --glb`).

**Prompt de conceito (template):**
```
[STYLE BIBLE] Character/prop turnaround sheet of {OBJETO}: front view, side view and
back view side by side, orthographic, same scale, neutral flat light grey background,
even soft lighting, no shadows on the ground, full object visible, no text.
```

---

## 5. Lista de modelos 3D

Orçamento em triângulos (tris). Tamanhos em centímetros (largura × profundidade × altura).

### 5.1 Tabuleiro e cenário
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `board_corte` | 80 × 50 × 3 | 15k | A flat thick game board shaped like a mountain cross-section cut in half, lying flat on a table; top surface carries the painted cross-section texture (section 3.2) with slight carved relief: tunnels sunken 3 mm, rock areas raised, timber supports slightly embossed. Wooden rim around the edge. |
| `board_boca_mina` | 8 × 6 × 7 | 2k | A small wooden mine entrance shack with a plank roof and a dark tunnel opening framed by timbers, a lantern hanging by the door. Sits on top of the board at the surface node. |
| `board_elevador` | 5 × 5 × 14 | 2k | A wooden mine headframe tower with a pulley wheel on top and a small iron cage elevator hanging inside it. |
| `board_elevador_gaiola` | 3 × 3 × 4 | 600 | A small iron-bar elevator cage with a wooden floor, separate movable piece. |
| `board_mascate` | 6 × 4 × 5 | 1.5k | A tiny underground peddler stall: a crate counter with a canvas awning, hanging pots, lanterns and ropes for sale. |
| `board_barracao` | 7 × 5 × 5 | 1.5k | A rustic wooden miners' shed with a coffee pot on a small stove and a bench. |
| `board_escada` | 1.5 × 0.5 × 6 | 300 | A simple wooden ladder segment, slightly crooked, rope-tied rungs. Will be repeated between levels. |
| `board_trilho` | 10 × 2 × 0.5 | 400 | A straight mine rail segment with wooden ties, modular (ends line up for tiling). |
| `board_trilho_curva` | 6 × 6 × 0.5 | 500 | A 45-degree curved mine rail segment with ties, same gauge as board_trilho. |
| `board_carrinho` | 3 × 2 × 2 | 800 | A small wooden mine cart with iron bands and four iron wheels, half full of ore with a few gold glints. |
| `board_poco` | 3 × 3 × 1 | 400 | A round shaft opening rim made of timbers around a black hole, with a frayed rope. |
| `board_geodo` | 3 × 3 × 2.5 | 800 | A cracked-open rock geode with teal-white crystals inside, glowing slightly. |
| `board_respiro` | 2.5 × 2.5 × 4 | 500 | A small air vent shaft opening in the rock ceiling with a beam of daylight and dust motes falling onto a round stone spot. |
| `board_altar` | 2.5 × 2.5 × 1.2 | 300 | A small stone pedestal for a relic, roughly carved. |
| `board_ninho` | 14 × 10 × 4 | 4k | A circular ember-lit cave nest of coiled rock ridges and gold debris, where the boss figure stands. |
| `board_agua` | 80 × 50 × 0.2 | 50 | A flat translucent water plane, dark blue #2F5D7C, slightly wavy surface (used animated in engine; rises level by level). |

### 5.2 Peças dos jogadores
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `peao_garimpeiro` | 2 × 2 × 4 | 2k | A chunky stylized miner meeple figure: helmet with lamp, scarf, backpack, holding a pickaxe on the shoulder, on a round base. Neutral grey-white so the engine can tint it per player. |
| `peao_garimpeiro_{urucum,anil,mata,ipe}` | 2 × 2 × 4 | 2k | Same miner figure painted with the player color scarf and base (#B8402E, #2E4F8C, #3F7A3A, #E3B72B); same mesh, different texture. |
| `cubo_jogador` | 0.8 × 0.8 × 0.8 | 12 | A wooden cube with slightly rounded edges, neutral (engine tints per player). |
| `cubo_pedra` | 0.8 × 0.8 × 0.8 | 40 | A small rough black stone shaped roughly like a cube. |
| `tabuleiro_pessoal` | 24 × 8 × 0.4 | 300 | A thin wooden player tray with the player mat texture (section 3.4) and 10 small circular dents along the top. |

### 5.3 Chefe, Bateia e marcadores
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `chefe_mae_do_ouro` | 12 × 10 × 9 | 12k | Hero figure: the Mãe-do-Ouro, a giant coiled serpent spirit made of molten gold and flames, head raised, glowing ember eyes, scales gold fading to ember red, flame wisps along the back, majestic and folkloric (not a dragon: no legs, no wings). On a rocky round base. |
| `bateia` | 10 × 10 × 3 | 1k | A large shallow wooden-and-metal gold pan (bateia) used as the cube bowl, wide rim, worn texture, empty inside. |
| `furia_trilha` | 18 × 3 × 0.5 | 300 | A thin carved stone strip with 6 shallow round sockets, ember cracks between them, getting hotter toward the end. |
| `furia_marcador` | 1.2 × 1.2 × 1.5 | 300 | A small flame-shaped ember red token on a round base. |
| `agua_marcador` | 1.5 × 1.5 × 1.5 | 300 | A blue water-drop shaped token on a round base. |
| `desabamento` | 3 × 2 × 2 | 600 | A small pile of fallen rocks and a broken timber beam blocking a passage. |
| `grisu` | 2.5 × 2.5 × 2.5 | 500 | A semi-transparent yellow-green gas puff cloud token on a small base. |

### 5.4 Recursos e tesouros
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `pepita` | 1 × 1 × 0.6 | 100 | A lumpy shiny gold nugget, metallic gold. |
| `cristal` | 1 × 1 × 1.8 | 150 | A single pointed quartz crystal, teal-white, slightly translucent. |
| `folego` | 1 × 1 × 1 | 100 | A cluster of three soft glowing air bubbles, translucent blue. |
| `reliquia_bateia` | 2 × 2 × 0.8 | 600 | Ancient hammered gold pan with engraved spirals (concept: section 2.6 cell 1). |
| `reliquia_lampiao` | 1.5 × 1.5 × 2.5 | 800 | Ornate silver lantern with a blue flame inside (cell 2). |
| `reliquia_sino` | 1.5 × 1.5 × 2 | 600 | Small aged bronze bell with carved vines (cell 3). |
| `reliquia_coroa` | 2 × 2 × 1.5 | 800 | Crown of rough pink quartz points on a twisted gold band (cell 4). |
| `reliquia_ferradura` | 2 × 0.5 × 2 | 500 | Golden horseshoe with small green stones, standing on a tiny stand (cell 5). |
| `reliquia_topazio` | 1.8 × 1.8 × 2 | 700 | Large faceted topaz in a golden claw setting (cell 6). |
| `reliquia_escama` | 2.5 × 0.6 × 2.5 | 500 | One huge shimmering gold-to-ember scale on a small stand (cell 7). |
| `mascate_capacete` | 2 × 2 × 1.5 | 600 | Miner helmet with electric headlamp. |
| `mascate_corda` | 2 × 2 × 1 | 500 | Coil of rope with a carabiner. |
| `mascate_mochila` | 2 × 1.5 × 2 | 600 | Patched canvas backpack with a pan tied on. |
| `mascate_cantil` | 1.2 × 1.2 × 2 | 400 | Metal canteen with a brass valve. |

### 5.5 DLCs (Cérbero e Medusa)
Veja as regras em `02_dlcs.md`. Mesmo TECH SPEC.

| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `chefe_cerbero` | 10 × 8 × 8 | 10k | Hero figure: a huge three-headed guard dog of the underworld, stylized and slightly comic-folkloric, bronze-and-soot fur, a thick bronze collar with a broken chain, three heads each with a different expression (one sleepy, one grumpy, one snarling), standing on a rocky round base with a few gold nuggets. Not gory. |
| `cerbero_cabeca` | 1.5 × 1.5 × 0.6 | 300 | A round two-sided token: one side a sleeping dog head with closed eyes, the other side an awake dog head with glowing ember eyes. Model both faces in relief. |
| `chefe_medusa` | 8 × 8 × 10 | 10k | Hero figure: Medusa reimagined as a mine-dwelling gorgon, upper body of a woman with a miner's tattered shawl, hair made of pale cave snakes, glowing teal eyes, lower body a coiled serpent tail wrapped around a mine beam, half-turned-to-stone miner's helmet at her feet. Elegant and eerie, not gory. Rocky round base. |
| `reliquia_coleira` | 2 × 2 × 1 | 600 | A heavy bronze dog collar with three rings and green patina, on a small stand. |
| `reliquia_veu` | 2 × 0.6 × 2.5 | 600 | A delicate veil made of thin stone-like fabric with tiny snake-scale patterns, draped on a small stand. |
| `estatua_garimpeiro` | 2 × 2 × 4 | 1.5k | The miner meeple figure (same pose as peao_garimpeiro) turned to grey cracked stone, to place on the board for flavor when someone is petrified. |

### 5.6 Cartas e mobília
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `carta` | 6.3 × 8.8 × 0.03 | 12 | A plain playing card with rounded corners, separate UV islands for front and back (textures applied by the engine). |
| `pilha_cartas` | 6.3 × 8.8 × 2 | 60 | A neat stack of cards, slightly uneven edges, card back on top. |
| `lampiao_mesa` | 6 × 6 × 14 | 1.5k | A decorative brass kerosene lantern to sit on the table corner as a light source (engine adds a warm point light inside). |
| `caixa_jogo` | 30 × 30 × 7 | 300 | A board game box lid; the top uses the key art texture (section 3.5). |

> A mesa em si é a mesma do MANDATO (`TableFurniture.jsx`). Só o tabuleiro, as peças e a luz mudam.

---

### 5.7 Folha de arte das DLCs (9, grid 3×3, célula 4:5)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 4:5. Creatures are spooky-cute, readable, not gory.
1. Cérbero: a three-headed bronze-furred guard dog sleeping curled in an ember-lit cave, one head peeking with one eye open, broken chain.
2. Bolo de Mel: a round honey cake dripping honey on a tin plate, held out toward a giant dog nose in the shadows.
3. Viola de Três Cordas: a rustic country guitar with only three strings, musical notes drawn as soft glowing dots, a giant dog head dozing beside it.
4. Osso Gigante: a comically huge bone thrown through a tunnel, three dog heads turning to follow it.
5. Uivo Triplo: three dog silhouettes howling at once, sound shown as dust rings shaking the timber supports.
6. Medusa: a mine-dwelling gorgon with pale cave-snake hair and glowing teal eyes, coiled around a mine beam, half in shadow.
7. Espelho de Bronze: a round polished bronze hand mirror reflecting a teal glow back into a dark tunnel.
8. Escultor de Pedra-Sabão: an older Brazilian stone carver with a chisel, chipping a grey stone crust off a relieved miner's arm.
9. Olhar da Górgona: two huge glowing teal eyes opening in the dark at the end of a tunnel, a lantern turning grey as it is reached by the light.
```
Carta **Petrificado** (arte única, 4:5): `[STYLE BIBLE] A miner's hand and pickaxe turned to cracked grey stone, small pebbles falling, lantern light fading. No text.`

## 5.8 v0.2: peças de Sala (mapa explorado)

> Já estão prontos e continuam valendo: a folha-piloto (2.1) e os 8 recortes, e os modelos `cubo_jogador`, `cubo_pedra`, `pepita`, `cristal`, `board_escada`, `board_trilho` e `board_altar`.
> **Mudou:** o tabuleiro deixa de ser uma placa única (3.2 e `board_corte`). Agora é uma **moldura em corte** com uma grade de 9 × 5 casas, onde as peças de Sala vão sendo colocadas. O `board_corte` vira a moldura (abaixo). A textura 3.2 continua útil como fundo de rocha atrás da grade.

### Arte das peças de Sala (folha 4×4, célula 1:1, vista lateral em corte)
```
[STYLE BIBLE] [SHEET RULES: N=16, COLS=4, ROWS=4] Cell ratio 1:1. Each cell is ONE square cut-away
mine room seen from the side (like a slice of an ant farm), rock border around, the room in the middle,
tunnel openings left and right at mid-height, room for a ladder hole at the top and bottom centre.
1. Galeria Vazia: an empty timbered gallery with a lantern hook and scattered pebbles.
2. Galeria de Entrada: the first gallery under the surface, daylight from a hole above, ladder going up.
3. Respiro: a gallery with a narrow vent shaft of daylight and floating dust, fresh air feeling.
4. Geodo: a gallery with a cracked-open geode wall full of teal-white crystals.
5. Veio de Ouro: a gallery with a glittering gold vein running across the back wall.
6. Câmara do Eco: a tall round cave chamber with sound-ring dust waves and dripping stalactites.
7. Capela Soterrada: a tiny buried chapel nook with a simple wooden bench and candles (no religious symbols).
8. Depósito Abandonado: an old storage room with crates, rope coils and dusty tools.
9. Mascate: an underground peddler stall with a canvas awning and hanging pots.
10. Poço do Elevador: a gallery with an iron cage elevator in a vertical shaft.
11. Altar: a stone pedestal room with a soft golden glow, empty pedestal on top.
12. Ninho da Mãe-do-Ouro: a huge ember-lit cave with coiled gold debris and a sleeping fire-serpent silhouette.
13. Portão de Bronze (DLC Cérbero): a massive bronze gate in the rock with three dog-head knockers.
14. Canil Abandonado (DLC Cérbero): an abandoned kennel cave with giant gnawed bones.
15. Jardim de Estátuas (DLC Medusa): a cave garden of grey stone miner statues with surprised poses.
16. Salão dos Espelhos (DLC Medusa): a cave with polished bronze mirror shards on the walls.
```
A **Pedreira de Pedra-Sabão** (DLC Medusa) é uma 17ª célula, para gerar sozinha: `a soapstone quarry room with half-carved grey-green blocks and chisels`.
As **saídas** (túnel, túnel escuro, trilho, Toca, escada, poço, desabamento) **não** vão na arte: são marcadores desenhados por cima pelo jogo, porque cada peça pode ser espelhada.

### Relíquias novas (completar a folha 2.6)
```
[STYLE BIBLE] Same relic style as section 2.6, 1:1 each, on a small stone pedestal:
1. Moeda do Império: a large old gold coin with a worn crowned profile (fictional, no real monarch).
2. Pente de Tartaruga e Ouro: an ornate hair comb of tortoiseshell pattern and gold filigree.
3. Bússola de Ouro: a golden pocket compass with an engraved lid, needle glowing.
4. Ídolo da Serra: a small carved stone-and-gold idol shaped like a stylized mountain with eyes.
```

### Modelos 3D v0.2 (mesmo TECH SPEC)
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `board_moldura` | 70 × 44 × 4 | 8k | A wooden frame shaped like a mountain cut in half, lying flat on the table, with a grassy top edge, a mine-entrance shack at the top centre, and an inner recessed grid of 9 columns × 5 rows of square slots (7 cm each) where room tiles are placed. Rock texture between slots. |
| `sala_peca` | 7 × 7 × 0.8 | 200 | A thick square room tile with slightly bevelled edges; the top face carries the room art texture (from the 4×4 sheet). The engine swaps the texture per room. |
| `saida_tunel` / `saida_escuro` / `saida_trilho` / `saida_toca` / `saida_escada` / `saida_poco` / `saida_desabamento` | 2 × 1.5 × 0.6 | 150 cada | Small clip-on markers placed on a tile edge: a timber tunnel arch / the same arch filled with dark shadow / a rail stub / an arch with a small paw print / a ladder stub / a round hole with rope / a pile of rocks. |
| `reliquia_moeda` · `reliquia_pente` · `reliquia_bussola` · `reliquia_idolo` | ~2 × 2 × 1.5 | 500–800 | Same style as the other relics (section 5.4). |

## 5.9 v0.3: cartas novas de economia (folha 3 + 6 vazias, ou junte numa folha futura)
```
[STYLE BIBLE] [SHEET RULES: N=3, COLS=3, ROWS=1] Cell ratio 4:5.
1. Caderneta de Fiado: a worn little credit notebook tied with string on a shop counter, a pencil stub, coins next to it (no writing visible).
2. Lampião de Mão: a small brass hand lantern held up by a miner's hand, warm light, a coin purse hanging from the wrist.
3. Comprador de Ouro: a sharp-dressed gold buyer with a small brass scale and a magnifying loupe, weighing a nugget, friendly smirk.
```

## 5.10 Onde a arte entra no jogo
A tela do GARIMPO usa recortes WebP gerados das folhas de `imagens/`: `frontend/public/garimpo/cards/<ID>.webp` (ID da carta, como `LAMP`, `CARB`, `R30`), `icons/`, `verso.webp`, `capa.webp` e `tabuleiro.webp`. Os modelos ficam em `frontend/public/garimpo/models/garimpo.glb`. Quando uma folha for refeita, basta recortar de novo com a mesma ordem de células deste guia. Quando chegarem modelos novos no GLB, a mesa 3D (`src/garimpo/ui/Table3D.jsx`) os usa pelo nome do objeto, e o que ainda não foi modelado aparece com geometria simples no mesmo lugar.

## 5.11 v0.4: peças de mina com várias salas, tabuleiro do jogador e trilhas

> **Mudou de novo:** as peças agora são **quadrados 3×3 com 2 a 5 salas** ligadas por túneis, com saídas no meio das bordas. Elas substituem a folha 4×4 de "uma sala por peça" da seção 5.8. As ilustrações das **salas** dessa folha continuam úteis como arte de cada sala (círculos ou medalhões dentro da peça).

### Peça de mina (textura de fundo, 1:1, vista de cima)
```
[STYLE BIBLE] Top-down square game tile of an underground mine section, seen straight from above:
dark carved rock with timber-lined tunnels. Leave EMPTY round clearings (for rooms) at these 3×3 grid
spots: {LISTA DE POSIÇÕES}, connected by tunnels; tunnels reach the middle of these edges: {BORDAS}.
Tunnel styles: normal = timber-framed; tight = narrow dark crack; rail = with mine rails; den = small claw
marks. No text, no icons, no rooms painted (rooms are added by the game).
```
Gere 1 textura por formato e use rotações: `cruz` (centro + 4 bordas), `anel` (4 bordas ligadas em anel), `tee`, `canto`, `reta` e `dupla` (ver `TILE_LAYOUTS` em `data.js`). Faça uma versão **Segura** (rocha mais clara, terra) e uma do **Fundo** (rocha escura, veios de brasa) de cada uma.

### Peça da Boca (1:1)
```
[STYLE BIBLE] Top-down square tile: the mine entrance seen from above, a wooden headframe and daylight
falling into a central round shaft, a small miners' shed on the west side, three timber tunnels leaving
to the north, east and south edges. No text.
```

### Tabuleiro do jogador (3:1)
```
[STYLE BIBLE] Player board seen from above: a wooden plank with a row of 10 square slots carved as a
"breath meter" (the last slot outlined in ember red), a small canvas pouch area for the cube reserve,
and a tray for the relic carried. No text, no numbers.
```

### Trilha da Fúria e Bateia (16:5)
```
[STYLE BIBLE] A long carved stone strip with 7 round sockets getting hotter from left to right (cool grey
to glowing ember), a coiled gold-and-fire serpent along the top edge, and on the right a big wooden gold
pan (bateia) seen from above, empty. No text, no numbers.
```

### Relíquias novas (mesmo estilo da 2.6)
```
1. Colar de Contas de Ouro: a necklace of small hammered gold beads on a leather cord.
2. Candelabro de Prata: a three-armed silver candlestick, tarnished, with stubs of candle.
3. Cálice de Esmeralda: a gold chalice set with rough green emeralds.
4. Máscara de Ouro: a stylized gold mask with hollow eyes and engraved sun rays (fictional, no real culture).
```

### Modelos 3D v0.4 (mesmo TECH SPEC)
| ID | Tamanho | Tris | Prompt 3D |
|---|---|---|---|
| `peca_mina_{cruz,anel,tee,canto,reta,dupla}` | 9,6 × 9,6 × 0,6 | 600 cada | Thick square mine tile seen from above, carved rock surface with sunken timber-lined tunnels following the layout, round shallow clearings where rooms sit (rooms are separate pieces). Two textures: safe (lighter) and deep (darker). |
| `peca_boca` | 9,6 × 9,6 × 2 | 1,5k | Start tile with a small wooden headframe over a central round shaft, shed on the west side. |
| `sala_disco` | 2,6 × 2,6 × 0,35 | 120 | Round room token that sits in a clearing; top face gets the room art. |
| `medidor_folego` | 22 × 3 × 0,5 | 300 | Wooden strip with 10 square sockets for damage cubes. |
| `trilha_furia` | 18 × 3 × 0,5 | 300 | Replaces `furia_trilha`: 7 sockets instead of 6. |

## 5.12 v0.5: cartas novas da Coleção e faixa de família
```
[STYLE BIBLE] [SHEET RULES: N=2, COLS=2, ROWS=1] Cell ratio 4:5.
1. Amostra de Minério: a small labeled-free cloth sample bag spilling ore chunks with gold flecks onto a wooden tray, a magnifier beside it.
2. Lupa de Garimpeiro: a brass loupe held over a glittering rock, the lantern light focused into a bright spot.
```
As cartas agora têm uma **faixa de família** no canto: Turma (tijolo #C8553A), Oficina (cobre #3E8C7E) e Coleção (ocre #C98A2E). O jogo desenha a faixa por cima da arte, então ela **não** vai na ilustração. As cartas Caderneta de Fiado, Lampião de Mão e Comprador de Ouro (seção 5.9) ainda precisam de arte.

## 6. Checklist de entrega (o que pedir de volta ao outro chat)

- [ ] 6 folhas de arte de carta aprovadas (2.1 a 2.6) + folha das DLCs (5.7) e o Petrificado, em PNG grande
- [ ] Verso, tabuleiro, ícones, tabuleiro pessoal e key art (3.1 a 3.5)
- [ ] Todos os IDs da seção 5 como GLB separado **ou** um `garimpo.glb` com os objetos nomeados pelo ID
- [ ] Um render de cada modelo sobre fundo neutro, para revisão
- [ ] Contagem de triângulos e tamanho conferidos com a tabela
