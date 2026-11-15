# 12 — Guia de Prompts de IA para as Cartas (folhas com várias cartas por imagem)

## 0. Estratégia (leia primeiro)

**IA de imagem erra texto e números.** Então o fluxo é:

1. **IA gera só a ARTE** (sem texto nenhum), várias de uma vez numa **folha** (sprite sheet / contact sheet).
2. Você **fatia** a folha em cartas individuais (script na seção 9).
3. Um **compositor** (Figma, Canva, nanDeck ou script) coloca moldura, nome, custo e regras a partir dos `.md`/CSV.
4. Exporta PNG/PDF para impressão ou para o site.

```
Folha de arte (IA) → fatiar → arte por carta → + moldura/texto (dados) → carta pronta
```

**Por que folhas?** Estilo **consistente** (mesma "rodada" de geração), economiza tempo e dinheiro. **Limite realista:** de 6 a 12 cenas por imagem. Acima disso a IA começa a misturar células e perder qualidade.

---

## 1. O "Style Bible" (cole no início de TODO prompt)

```
STYLE BIBLE: retro mid-century urban-planning poster meets tilt-shift paper
miniature diorama. Clean simple shapes, soft paper-grain texture, gentle
top-left light with soft long shadows, friendly slightly satirical bureaucratic
mood. Limited palette: teal #1F6F78, mustard #E0A526, brick red #C4533A,
sage green #8DAA7E, plum #6B3F69, navy ink #1B2A41, cream #F3EBDD.
Isometric 3/4 view for buildings. No photorealism, no 3D render look.
```

**Regras fixas para toda folha (cole depois do Style Bible):**

```
SHEET RULES: single image containing {N} fully separate illustrations in a
{COLS} columns x {ROWS} rows grid. Every cell has the same size. Cells are
separated by wide, even gutters of flat solid cream #F3EBDD with no content
in the gutters. Each illustration is its own isolated composition with the
main subject centered inside the middle 70% of its cell. NO text, NO letters,
NO numbers, NO logos, NO watermarks, NO signatures, NO frames, NO borders,
NO captions, NO real brands, NO real people, NO national flags.
```

**Negative prompt (se a ferramenta tiver campo separado):**
`text, letters, numbers, watermark, signature, logo, frame, border, caption, photorealistic, 3d render, blurry, overlapping cells, merged cells, extra cells`

---

## 2. Template de folha

```
[STYLE BIBLE]
[SHEET RULES com N, COLS, ROWS]
Cell aspect ratio: {5:4 | 4:5 | 1:1 | 3:2}.
Cells in reading order (left to right, top to bottom):
1. ...
2. ...
```

### Dicas por ferramenta

| Ferramenta | Dicas |
|---|---|
| **Midjourney** | `--ar` conforme a folha (ex.: 3x3 de células 1:1 → `--ar 1:1`; 4x2 de 5:4 → `--ar 5:2`); `--style raw`; use **`--sref`** com a 1ª folha aprovada para travar o estilo; `--no text, letters, numbers, frame` |
| **GPT Image / DALL·E** | Anexe a folha aprovada como **imagem de referência** ("same style as the attached sheet"); peça "no text anywhere" |
| **Gemini (imagem)** | Idem: envie referência; descreva o grid em frases curtas; regenere células ruins por edição |
| **Flux / Stable Diffusion** | Use LoRA/IP-Adapter de referência de estilo; `negative prompt` acima; gere 2x2 ou 3x2 para mais controle |
| **Qualquer uma** | Fixe a **seed** quando possível; gere 4 variações e escolha a melhor folha |

### Fluxo de qualidade
1. **Folha-piloto** com 6 cenas (Tier I Edificações). Ajuste o Style Bible até ficar bonito.
2. **Aprove o estilo** → use como referência em todas as outras folhas.
3. Células ruins → **regenere só aquela** (inpainting/edição) em vez de refazer a folha.
4. **Upscale** (2x–4x) antes de fatiar se a resolução for baixa.

---

## 3. Folhas — Edificações (24) + Regionais (18)

Proporção de célula: **5:4**.

### 3.1 Tier I (8 células, grid 4×2)
```
[STYLE BIBLE] [SHEET RULES: N=8, COLS=4, ROWS=2] Cell ratio 5:4.
1. E1-01 Conjunto Habitacional: three low-rise social housing blocks in warm sand tones, laundry lines, small balconies.
2. E1-02 Mercadinho de Bairro: tiny corner shop with striped sky-blue awning, crates of fruit outside, bicycle leaning.
3. E1-03 Oficina Metalúrgica: small brick workshop with one chimney puffing grey smoke, sparks, stacked steel bars.
4. E1-04 Posto de Saúde: compact one-storey clinic, coral roof, a simple white plus sign on a teal board (no letters), waiting bench.
5. E1-05 Praça Arborizada: small town square with round fountain, benches, leafy trees, sage green lawn.
6. E1-06 Painel Solar Comunitário: rows of solar panels on a small field, tilted toward sun, tiny control shed.
7. E1-07 Estação de Tratamento: two round water tanks, pipes, blue basin, small pump house.
8. E1-08 Feira Livre: open-air market stalls with colorful tarps, baskets, tiny crowd silhouettes.
```

### 3.2 Tier II (9 células, grid 3×3)
```
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 5:4.
1. E2-01 Torre Residencial: tall slim residential tower, many small windows, plants on balconies.
2. E2-02 Shopping Center: wide mall with glass atrium, parking lot, colorful rooftop banners without text.
3. E2-03 Siderúrgica: steel mill with tall stacks, glowing orange furnace, heavy smoke.
4. E2-04 Usina a Gás: gas power plant with round tanks, pipes and two smokestacks, thin flame.
5. E2-05 Hospital Municipal: mid-size hospital with helipad on roof, ambulance bay, green plus sign.
6. E2-06 Universidade Técnica: campus with brick building, clock tower without numerals, lab wing, students as tiny silhouettes.
7. E2-07 Parque Linear: long narrow park with winding path, ponds, joggers silhouettes, rows of trees.
8. E2-08 Estação de Metrô: street-level subway entrance with canopy, escalator stairs, a train arriving in background.
9. E2-09 Porto Comercial: harbor docks with stacked containers in teal/mustard/brick, crane, cargo ship.
```

### 3.3 Tier III (7 células + 1 vazia, grid 4×2)
```
[STYLE BIBLE] [SHEET RULES: N=7, COLS=4, ROWS=2, last cell left EMPTY cream] Cell ratio 5:4.
1. E3-01 Arranha-Céu Misto: glass skyscraper with shops at the base and apartments above, rooftop garden.
2. E3-02 Complexo Industrial: sprawling factory complex with conveyor belts, many chimneys, smog layer.
3. E3-03 Usina Nuclear: two hyperboloid cooling towers with white steam, containment dome, fenced perimeter (no warning symbols).
4. E3-04 Centro de Convenções: huge modern expo hall with curved roof, plaza with flags as plain colored pennants, crowds.
5. E3-05 Aeroporto Internacional: terminal with control tower, small jet landing, runway lines.
6. E3-06 Smart City Hub: futuristic control center with satellite dishes, glowing teal data rings, rooftop antennas.
7. E3-07 Usina de Reciclagem e Energia: recycling plant with sorting belts, bales of material, small stack with white steam, green roof.
```

### 3.4 Regionais (18 células = 2 folhas de 9, grid 3×3)
```
FOLHA REGIONAL A — Litoral / Montanha / Planície (3 each)
[STYLE BIBLE] [SHEET RULES: N=9, COLS=3, ROWS=3] Cell ratio 5:4.
1. Porto Pesqueiro: small fishing pier with wooden boats and nets, fish crates.
2. Farol Histórico: tall striped lighthouse on rocks, waves, gulls.
3. Resort Litorâneo: beachfront resort with palm trees, pool, striped umbrellas.
4. Mina de Cobre: mine entrance in rock face, ore carts, wooden supports.
5. Pequena Hidrelétrica: small dam on mountain river with powerhouse.
6. Teleférico Turístico: cable car station on a mountain slope, cabin, pine trees.
7. Silo Cooperativo: cluster of grain silos beside wheat fields, tractor.
8. Cooperativa Agrícola: farmhouse with community barn, produce crates, banner without text.
9. Moinho Eólico: tall wind turbine on green plain with a small barn.

FOLHA REGIONAL B — Deserto / Floresta / Ilha (3 each)
1. Poço do Oásis: stone well and palm trees around a small blue oasis pond.
2. Fazenda Solar: huge field of mirrors/panels on sand dunes.
3. Poço de Petróleo: oil pumpjack on orange desert, storage tank.
4. Pousada Ecológica: wooden eco-lodge on stilts among trees, hammocks.
5. Estação de Pesquisa: forest research station with antenna, wooden walkways.
6. Santuário: sacred grove with ancient giant tree, soft light rays, stone path.
7. Resort Insular: luxury overwater bungalows on turquoise sea.
8. Balsa Rápida: small ferry boat crossing between two islands, wake.
9. Estaleiro: shipyard with hull on stocks, crane, scaffolding.
```

---

## 4. Folhas — Administração e Aliados (20) + Básicas (4) + Padrão (4)

**Retrato:** proporção **4:5**, busto (ombros para cima), 3/4, pessoas **fictícias**, diversas (idade, etnia, gênero), expressão marcada. Adicione ao Style Bible:

```
PORTRAIT STYLE: flat gouache-like illustration, thick soft shapes, expressive
faces, fictional diverse characters, tinted solid backdrop in the faction color
(teal / sage / mustard / brick / plum), shoulders-up, slightly caricatured.
```

### 4.1 Tier I (7 → grid 4×2, 1 vazia)
```
[STYLE BIBLE + PORTRAIT STYLE] [SHEET RULES: N=7, COLS=4, ROWS=2] Cell ratio 4:5.
1. A1-01 Chefe de Gabinete: woman in navy blazer holding stacked folders and a phone.
2. A1-02 Engenheira Chefe: engineer in hard hat with rolled blueprints, teal backdrop.
3. A1-03 Fiscal de Obras: inspector with clipboard, reflective vest, stern look.
4. A1-04 Assessora de Imprensa: young woman with headset and microphone, camera flashes behind.
5. A1-05 Líder Sindical: broad man with raised fist-sized wrench (not a fist), union armband without text, brick backdrop.
6. A1-06 Ecóloga Municipal: scientist with leaf sample and binoculars, sage backdrop.
7. A1-07 Lobista: slick man in suit with a briefcase slightly open, mysterious smile.
```

### 4.2 Tier II (8 → grid 4×2)
```
[STYLE BIBLE + PORTRAIT STYLE] [SHEET RULES: N=8, COLS=4, ROWS=2] Cell ratio 4:5.
1. A2-01 Urbanista Visionário: man with round glasses holding a glowing city model, teal backdrop.
2. A2-02 Diretor Financeiro: woman with calculator and ledger, mustard backdrop.
3. A2-03 Secretária de Meio Ambiente: confident woman with plant in hand, windmill pin, sage backdrop.
4. A2-04 Mestre de Obras: veteran builder with pencil behind ear, tape measure, brick backdrop.
5. A2-05 Consultor do Partido: man in gray suit with a thick binder and stamp.
6. A2-06 Deputado Amigo: jovial older man with a wide handshake pose, lapel pin.
7. A2-07 Contabilidade Criativa: nervous accountant with two ledgers, one hidden behind back.
8. A2-08 Empreiteira Amiga: smiling contractor with hard hat and envelope tucked in pocket.
```

### 4.3 Tier III (5 + 1 vazia, grid 3×2)
```
[STYLE BIBLE + PORTRAIT STYLE] [SHEET RULES: N=5, COLS=3, ROWS=2, last cell EMPTY] Cell ratio 4:5.
1. A3-01 Governador Padrinho: elder statesman with silver hair and warm smile, sash without text.
2. A3-02 Czar do Planejamento: severe planner with giant city map and compass.
3. A3-03 Ministro de Obras: tall man with golden hard hat and ceremonial ribbon scissors.
4. A3-04 Mestre da Propaganda: showman with megaphone and poster tube, vivid mustard backdrop.
5. A3-05 Chefe da Casa Civil: calm powerful woman in front of a heavy desk with many phones.
```

### 4.4 Básicas + Padrão (8 células, grid 4×2, estilo de objeto)
```
[STYLE BIBLE] [SHEET RULES: N=8, COLS=4, ROWS=2] Cell ratio 5:4. Object illustrations, centered, simple.
1. B-01 Orçamento Municipal: neat stack of coins and a small budget ledger.
2. B-02 Mão de Obra Local: group of three workers with tools, silhouettes in hard hats.
3. B-03 Assessor Parlamentar: assistant at a small desk with phone and papers.
4. B-04 Planejador Urbano: person with a tabletop city model and ruler.
5. P-01 Loteamento: empty plots of land with wooden survey stakes and a string grid.
6. P-02 Licitação: bidding hall, gavel on a desk, sealed envelopes.
7. P-03 Explorar: explorer with binoculars and an unfolded map at a ridge.
8. P-04 Lobby: two figures shaking hands in a hallway with a briefcase between them.
```

---

## 5. Folhas — Decretos (6) + Intrigas (10)

### 5.1 Decretos (6, grid 3×2, estilo documento)
```
[STYLE BIBLE] [SHEET RULES: N=6, COLS=3, ROWS=2] Cell ratio 5:4. Each is an official document or object with a wax seal.
1. D1-01 Austeridade: scissors cutting a gold coin, rolled parchment with wax seal.
2. D1-02 Plano Verde: parchment with a leaf stamp and a tiny city silhouette surrounded by plants.
3. D2-01 Pacote de Estímulo: scroll with crane and stacked bricks, wax seal, little rocket.
4. D2-02 Lei de Zoneamento: city map divided into colored zones (yellow, blue, red, green), pins and ruler.
5. D2-03 Reforma Tributária: ledger, abacus and a stack of coins, wax seal.
6. D3-01 Estado de Emergência: red flashing siren on a desk with barricade tape and a sealed decree.
```

### 5.2 Intrigas (10, grid 5×2, estilo noir de papel)
```
[STYLE BIBLE] Mood: paper-cut noir, deep plum #6B3F69 backgrounds, dramatic side light.
[SHEET RULES: N=10, COLS=5, ROWS=2] Cell ratio 5:4.
1. I1-01 Denúncia Anônima: envelope slipped under a door, glowing crack of light.
2. I1-02 Campanha de Boatos: silhouettes whispering into megaphones, speech bubbles empty.
3. I1-03 Embargo Comercial: shipping container wrapped in chains and padlock at a port.
4. I2-01 Greve Geral: crossed tools and blank protest signs held up by a crowd of silhouettes.
5. I2-02 Sabotagem de Obra: wrench thrown into gears, scaffolding collapsing.
6. I2-03 Contra-Inteligência: shield with a large eye, a hand catching a dart.
7. I2-04 Pressão Parlamentar: two hands pushing a chess piece on a map table, gavel nearby.
8. I3-01 Vazamento de Documentos: cracked briefcase with papers flying out into the night.
9. I3-02 Auditoria Surpresa: inspector with magnifying glass bursting through office door.
10. I3-03 Aliança Estratégica: handshake over a blueprint, two shadows behind them.
```

---

## 6. Folhas — Obras-Prima (12, grid 4×3)

Proporção **5:4**, com atmosfera **dourada**, plano mais épico (ângulo ligeiramente baixo).

```
[STYLE BIBLE] Add: epic golden-hour lighting, slightly heroic low angle, warm gold rim light.
[SHEET RULES: N=12, COLS=4, ROWS=3] Cell ratio 5:4.
1. M-01 Estádio Olímpico: oval stadium with floodlights and flags as plain pennants.
2. M-02 Ponte Estaiada: elegant cable-stayed bridge over a river at sunset.
3. M-03 Jardim Botânico: huge glass greenhouse dome with tropical plants and paths.
4. M-04 Torre de Telecomunicações: slender broadcast tower with glowing observation deck.
5. M-05 Hidrelétrica Monumental: massive concrete dam with spillway and mist.
6. M-06 Grande Biblioteca: grand neoclassical library with steps and glowing windows.
7. M-07 Distrito Financeiro: cluster of glass towers with plaza and fountain.
8. M-08 Terminal Intercontinental: sweeping airport terminal with big jets at gates.
9. M-09 Memorial do Partido: monumental stone plaza with a giant abstract star sculpture (no real symbols).
10. M-10 Eco-Distrito Modelo: green district with vertical gardens, wind turbines, bike lanes.
11. M-11 Smart Grid Central: glowing control tower with transmission lines radiating outward.
12. M-12 Parque Industrial Modelo: tidy industrial park with clean factories, solar roofs, trees.
```
> Se a IA deformar a folha, faça 2 folhas de 6 (grid 3×2).

---

## 7. Folhas — Exploração (60 = 6 folhas de 10, grid 5×2)

Proporção **3:2**. **Tipo** (Achado/Sítio/Risco/Encontro) vira **ícone no composto**, não na arte. Adicione o mood do terreno (`11 §6`) ao Style Bible em cada folha.

### 7.1 Litoral (mood: sunny beach, sky-blue, sand, coral)
```
[STYLE BIBLE + terrain mood] [SHEET RULES: N=10, COLS=5, ROWS=2] Cell ratio 3:2.
1. X-LIT-01 Cardume Farto: huge school of silver fish under a boat.
2. X-LIT-02 Porto Pesqueiro: wooden pier with nets and crates.
3. X-LIT-03 Farol Histórico: striped lighthouse.
4. X-LIT-04 Resort de Luxo: beach resort with pool.
5. X-LIT-05 Mar Calmo: glassy sea with sailboats at sunrise.
6. X-LIT-06 Tempestade no Horizonte: dark storm clouds over the sea, lightning.
7. X-LIT-07 Pescadores Sindicalizados: fishermen gathered on the dock, nets raised.
8. X-LIT-08 Petróleo Offshore: oil platform at sea, flare.
9. X-LIT-09 Turistas!: crowd of tourists with hats and cameras on the beach.
10. X-LIT-10 Ruínas Submersas: ancient columns visible under clear water.
```

### 7.2 Montanha (mood: misty morning, slate blue, ochre, pine green)
```
1. X-MON-01 Veio de Ferro: rock face with glowing iron-orange vein.
2. X-MON-02 Mina de Cobre: mine entrance with copper-green stains.
3. X-MON-03 Barragem Natural: natural rock dam with waterfall.
4. X-MON-04 Mirante Panorâmico: scenic overlook platform with telescope over valley.
5. X-MON-05 Avalanche: snow sliding down a slope toward a small hut.
6. X-MON-06 Mineiros em Greve: miners with helmets sitting in protest at a mine gate.
7. X-MON-07 Gruta de Cristais: cave full of glowing blue crystals.
8. X-MON-08 Pedreira Antiga: terraced quarry with old cranes.
9. X-MON-09 Velho Túnel: abandoned railway tunnel entrance with vines.
10. X-MON-10 Geólogo Corrupto: shady geologist pocketing a gold nugget behind a rock.
```

### 7.3 Planície (mood: golden afternoon, wheat green, wide sky)
```
1. X-PLA-01 Safra Recorde: giant wheat harvest with combine.
2. X-PLA-02 Silos Comunitários: row of silos with trucks.
3. X-PLA-03 Cooperativa Agrícola: farmers unloading crates at a barn.
4. X-PLA-04 Moinho Eólico: old windmill and new turbine side by side.
5. X-PLA-05 Mão de Obra Sazonal: workers harvesting in a line.
6. X-PLA-06 Feira Regional: village fair with tents and bunting.
7. X-PLA-07 Praga nas Lavouras: swarm of locusts over wheat.
8. X-PLA-08 Terreno Barato: wide empty field with a "for sale" stake (no text), surveyor.
9. X-PLA-09 Agronegócio Amigo: tycoon shaking hands with a farmer next to a big tractor.
10. X-PLA-10 Êxodo Rural: families with suitcases walking down a dirt road toward distant city.
```

### 7.4 Deserto (mood: orange sun, rose-earth sand, deep blue shadows)
```
1. X-DES-01 Oásis Escondido: hidden pond with palms between dunes.
2. X-DES-02 Campo Solar: sea of mirrors in the desert.
3. X-DES-03 Poço de Petróleo: pumpjack at dusk.
4. X-DES-04 Caravana de Mercadores: camel caravan loaded with goods.
5. X-DES-05 Tempestade de Areia: huge sand wall approaching.
6. X-DES-06 Ruínas Antigas: half-buried columns and statues.
7. X-DES-07 Aquífero Subterrâneo: cut-away view of underground blue water layer under sand.
8. X-DES-08 Nômades: tents and a campfire at twilight.
9. X-DES-09 Miragem: shimmering city on the horizon, lone traveler.
10. X-DES-10 Lítio!: salt flat with lithium pools in turquoise geometric ponds.
```

### 7.5 Floresta (mood: filtered green light, moss, amber, mist)
```
1. X-FLO-01 Clareira Fértil: sunlit clearing with rich soil.
2. X-FLO-02 Reserva Aliada: villagers and rangers shaking hands under giant trees.
3. X-FLO-03 Pousada Ecológica: wooden lodge on stilts.
4. X-FLO-04 Estação de Pesquisa: researchers with sensors and a canopy walkway.
5. X-FLO-05 Madeira Nobre: stacked precious logs on a truck.
6. X-FLO-06 Rio Cristalino: crystal-clear river with pebbles.
7. X-FLO-07 Bioma Raro: glowing rare flowers and exotic birds.
8. X-FLO-08 Madeireiros: chainsaws and fallen trees, smoky mood.
9. X-FLO-09 Extrativistas: rubber-tappers collecting latex.
10. X-FLO-10 Neblina Matinal: fog between tall trunks, tiny cabin.
```

### 7.6 Ilha (mood: turquoise water, coral, white sand, breeze)
```
1. X-ILH-01 Recife de Corais: colorful reef seen from above the water line.
2. X-ILH-02 Resort Insular: overwater bungalows.
3. X-ILH-03 Balsa Rápida: ferry between two small islands.
4. X-ILH-04 Estaleiro: boat builders at work on the beach.
5. X-ILH-05 Contrabando: night boat unloading crates in a hidden cove.
6. X-ILH-06 Turistas Estrangeiros: tourists disembarking with luggage.
7. X-ILH-07 Pescadores Locais: fishermen mending nets under palm trees.
8. X-ILH-08 Furacão: swirling storm over the sea, bending palms.
9. X-ILH-09 Cabo Submarino: cable laid on the seabed with a diver.
10. X-ILH-10 Porto Livre: bustling duty-free harbor with small boats.
```

---

## 8. Folhas — Metas (18), Rodada (12), Facções (4), Ícones (12), Terrenos (6)

### 8.1 Metas (18, 3 folhas de 6, grid 3×2, estilo emblema)
Proporção **1:1**; **emblemas circulares/heráldicos**, simples, com fundo liso.
```
[STYLE BIBLE] Style: flat badge/emblem illustration, centered symbol on plain disc, bold shapes, 2–3 colors each.
[SHEET RULES: N=6, COLS=3, ROWS=2] Cell ratio 1:1.

FOLHA META 1
1. G-01 Polo Comercial: three small shops in a row with coins.
2. G-02 Cinturão Industrial: ring of factories.
3. G-03 Cofres Cheios: open treasure chest overflowing with coins.
4. G-04 Metrópole: dense skyline of many towers.
5. G-05 Bairro Planejado: four houses in a perfect 2x2 square.
6. G-06 Distrito Verde: three trees around a pond.

FOLHA META 2
7. G-07 Autossuficiência: lightning bolt and water drop in a circle.
8. G-08 Cidade Limpa: clean skyline under bright blue sky with sparkles.
9. G-09 Povo Feliz: crowd of smiling faces forming a heart.
10. G-10 Rede Completa: six different small buildings arranged in a hexagon.
11. G-11 Mãos Limpas: two clean hands and a soap bubble.
12. G-12 Articulador: four colored threads tied in one knot.

FOLHA META 3
13. G-13 Líder de Bancada: podium with two flags as plain colored pennants.
14. G-14 Gabinete Completo: two framed decrees on a wall.
15. G-15 Canteiro de Obras: three cranes working at once.
16. G-16 Grande Planejador: huge blueprint with many marked plots.
17. G-17 Explorador: compass and unfolded map with dotted path.
18. G-18 Sobrevivente: shield with three check marks (no letters).
```

### 8.2 Cartas de Rodada (12, grid 4×3, estilo cena)
Proporção **3:2**, cena de **Evento** (a Auditoria é ícone no composto).
```
[STYLE BIBLE] [SHEET RULES: N=12, COLS=4, ROWS=3] Cell ratio 3:2.
1. RD-01 Boom Imobiliário: construction cranes everywhere, "sold" flags as plain red pennants.
2. RD-02 Temporada de Chuvas: heavy rain on a seaside town, puddles, umbrellas.
3. RD-03 Onda de Calor: huge sun over cracked earth and sweating people with fans.
4. RD-04 Greve de Transportes: stopped buses and trains, crowd waiting.
5. RD-05 Feriado Nacional: fireworks and streamers over a plaza, families.
6. RD-06 Crise Energética: city with half the windows dark, candles.
7. RD-07 Visita do Ministro: black car arriving with escorts and red carpet.
8. RD-08 Abalo Sísmico: cracks in the road, swaying buildings.
9. RD-09 Escândalo Nacional: reporters swarming a politician, camera flashes.
10. RD-10 Feira Internacional: expo grounds with flags as plain pennants, crowd.
11. RD-11 Sinal Verde do Partido: giant green traffic light over a city, thumbs-up.
12. RD-12 Corte Orçamentário: giant scissors cutting a stack of coins.
```

### 8.3 Facções (4 emblemas, grid 2×2, 1:1, vetor)
```
[STYLE BIBLE] Flat vector emblems, bold shapes, symmetrical, plain background.
[SHEET RULES: N=4, COLS=2, ROWS=2] Cell ratio 1:1.
1. Tecnocratas (teal #1F6F78): gear with ruler, circular badge.
2. Verdes (sage #8DAA7E): leaf inside a circle.
3. Empresários (mustard #E0A526): briefcase and coin in a diamond.
4. Sindicatos (brick #C4533A): crossed tools in a hexagon.
```

### 8.4 Ícones (12, grid 4×3, 1:1)
```
[STYLE BIBLE] Thick-line icon set, 2 colors each, rounded corners, navy outline, flat, centered, plain cream background.
[SHEET RULES: N=12, COLS=4, ROWS=3] Cell ratio 1:1.
1. coin 2. hammer with hard hat 3. ballot box with envelope 4. gold five-point star
5. wax seal stamp 6. smiley face 7. grey cloud with factory silhouette 8. lightning bolt
9. water drop 10. two bust silhouettes 11. magnifying eye 12. alarm siren with waves
```
> Para ícones o melhor é **redesenhar em vetor** (Figma/Illustrator) a partir da IA; PNG de IA serve de referência.

### 8.5 Terrenos (6 tabuleiros, uma imagem por terreno)
Gere **uma imagem top-down 1:1 por terreno**, depois sobreponha a grade 4x4 no editor.
```
[STYLE BIBLE] Top-down map illustration (orthographic, straight down) of a {TERRAIN} landscape on a square plate,
soft paper-cut layers, no buildings, no grid lines, no text, clean flat edges.
Features: {Litoral: sea band along the top edge, beach; Montanha: ridges at top, river in bottom-right, ore spots;
Planície: flat fields, river on the right; Deserto: dunes on left side and bottom, small oasis at center-bottom;
Floresta: dense forest patches at top-left and bottom-right; Ilha: three separate islands in turquoise sea}.
```

---

## 9. Fatiar as folhas (script)

Requer Python + Pillow. Fatia por grid fixo e **recorta os gutters**.

```python
# slice_sheet.py  —  uso: python slice_sheet.py folha.png 4 2 saida/ E1-01,E1-02,E1-03,E1-04,E1-05,E1-06,E1-07,E1-08
import sys, os
from PIL import Image

path, cols, rows, outdir, ids = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5].split(",")
margin = 0.04  # recorte interno de cada célula (4%) para tirar bordas/gutters
os.makedirs(outdir, exist_ok=True)

img = Image.open(path).convert("RGB")
W, H = img.size
cw, ch = W / cols, H / rows

i = 0
for r in range(rows):
    for c in range(cols):
        if i >= len(ids): break
        x0 = int(c * cw + cw * margin); x1 = int((c + 1) * cw - cw * margin)
        y0 = int(r * ch + ch * margin); y1 = int((r + 1) * ch - ch * margin)
        img.crop((x0, y0, x1, y1)).save(os.path.join(outdir, f"{ids[i]}_art.png"))
        i += 1
print(f"{i} cartas salvas em {outdir}")
```

**Se a IA não respeitou o grid:** abra no Photoshop/GIMP/Figma e fatie à mão com **guias**, ou use um detector de bordas (`cv2.findContours` sobre a cor do gutter `#F3EBDD`) — posso montar esse script se precisar.

---

## 10. Do arte à carta pronta

1. **Dados:** exporte as cartas para CSV/JSON (peça ao Claude: *"Converta as tabelas de `07_deck_especial.md` em um CSV com colunas id, nome, tipo, zona, faccao, aq, ob, cons, req, efeito, flavor, tier, alerta"*).
2. **Template:** monte o layout da carta (`11 §5`) em **Figma** (com plugin de *Data Merge*), **Canva** (Bulk Create), **nanDeck**/**Dextrose** (feitos para jogos de cartas) ou um **template HTML/CSS** renderizado para PNG (Playwright) — o mesmo componente `Card` do site (`09`) pode gerar as cartas.
3. **Exportar:** PNG 815×1110 com sangria para gráfica; **PDF** para print-and-play; **atlas de sprites** para o jogo web (e o Tabletop Simulator, se quiser testar).
4. **Flavor texts:** peça ao Claude 1 linha de humor burocrático por carta (curtas, em pt-BR).

### Prompt auxiliar para flavor text
```
Escreva 1 frase curta (máx. 90 caracteres) de humor burocrático e leve, em português do Brasil,
para cada carta abaixo. Sem política real, sem partidos reais. Tom: sátira de relatório oficial.
Formato: ID | frase
[cole a tabela]
```

---

## 11. Checklist final e cuidados

- [ ] Todas as folhas usam o **mesmo Style Bible** e a **mesma folha de referência**
- [ ] **Nenhum texto** dentro das imagens (todo texto vem do compositor)
- [ ] **Nada de personagens/marcas existentes** (só criações originais; sem simbologia de partidos/países reais)
- [ ] Pessoas fictícias; sem rostos de pessoas reais
- [ ] Resolução ≥ 1600 px de largura por célula antes de fatiar (idealmente upscale)
- [ ] IDs nos nomes dos arquivos
- [ ] Regenerar células ruins **individualmente**
- [ ] Revisar **direitos/termos de uso** da ferramenta de IA se pretende **vender** o jogo (muitas permitem; confira)
- [ ] Salvar **prompts e seeds** de cada folha (documento `prompts_usados.md`) para reproduzir depois

### Ordem de produção sugerida
1. Folha-piloto Tier I → estilo aprovado
2. Edificações (T2, T3, Regionais)
3. Obras-Prima
4. Admin/Aliados
5. Intrigas e Decretos
6. Exploração (6 folhas)
7. Metas, Rodada, Facções
8. Ícones e tabuleiros
9. Composição das cartas e impressão de protótipo

---

## 12. Folha extra — Prefeitura, Moradia Popular e as 4 zonas do Loteamento (6 células, grid 3×2)

As duas casas iniciais de toda cidade e o Loteamento construído em cada Zona. O Loteamento é um **lote genérico**,
então as 4 versões devem parecer **a mesma obra simples e barata**, mudando só o uso. Mesmo estilo e mesma base
isométrica das folhas de Edificações (3.1), para combinar no tabuleiro.

**Nome do arquivo ao salvar:** `Folha Prefeitura e Loteamento.png` (o script de recorte procura por esse nome).

```
[STYLE BIBLE] [SHEET RULES: N=6, COLS=3, ROWS=2] Cell ratio 5:4.
Same isometric 3/4 view, same small square ground plate and same soft top-left light as the Tier I buildings sheet.
1. PREF Prefeitura: small neoclassical town hall with a short clock tower without numerals, front steps, a plain
   mustard pennant on a flagpole (no symbols), two tiny trees, cream walls and brick-red roof. Civic and modest.
2. HOME Moradia Popular: two-storey simple social housing duplex in sage and cream, small front yard with laundry line,
   one tiny bicycle. Humble but cared for.
3. P-01-RES Loteamento residencial: modest single prefab family house on a simple lot, wooden fence, tiny garden,
   leftover survey stakes at one corner. Teal accents.
4. P-01-COM Loteamento comercial: small kiosk-style corner shop made from a shipping container, striped mustard awning,
   two crates of goods, leftover survey stakes at one corner.
5. P-01-IND Loteamento industrial: small prefab metal workshop shed with one short chimney with thin grey smoke,
   stacked pallets, leftover survey stakes at one corner. Brick-red accents.
6. P-01-INF Loteamento de infraestrutura: small utility compound with a water tank on legs and a short power pole with
   a transformer box, gravel ground, leftover survey stakes at one corner. Navy and teal accents.
```
> As 4 versões do Loteamento compartilham a **mesma base de terreno com estacas**: é isso que mostra que nasceram do
> mesmo lote. Se a IA variar demais o tamanho, peça "same plot size and same camera distance in cells 3 to 6".
