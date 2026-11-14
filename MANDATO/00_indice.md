# MANDATO — A Ascensão do Prefeito
### Documento de Design (título provisório) — versão 0.1

Um deck builder de 1 a 6 jogadores onde cada pessoa é prefeita de uma cidade fictícia e tenta **subir na hierarquia do Partido** antes dos outros, construindo uma cidade que bate as metas do Partido. Mistura o *deck building com mercado* de **Clank!**, a *disputa por vários caminhos de vitória* de **Dune: Imperium** e a *construção de cidade com zonas, infraestrutura e poluição* de **SimCity**.

---

## Índice dos arquivos

| Arquivo | Conteúdo |
|---|---|
| `00_indice.md` | Este arquivo: índice, glossário, decisões de design |
| `01_conceito_e_lore.md` | Pitch, pilares, lore, referências, fantasia do jogador, exemplo narrado |
| `02_regras_e_turno.md` | Regras completas: recursos, medidores, rodada, turno, construção, Facções, Fiscalização, fim de jogo, exemplo |
| `03_tabuleiro_principal.md` | Tabuleiro principal, trilha de Mérito/Cargos, Facções, deck de Metas (18), deck de Rodada (12), setup por nº de jogadores |
| `04_terrenos.md` | Os 6 terrenos: grade 4x4, traço, fraqueza, decks de Exploração (60 cartas), cartas Regionais, Metas Regionais |
| `05_deck_basico.md` | Deck inicial (10 cartas, igual para todos) |
| `06_deck_padrao.md` | Mercado Padrão (4 pilhas sempre disponíveis) |
| `07_deck_especial.md` | Deck Especial (60 cartas em 3 tiers), Decretos, Intrigas e as 12 Obras-Prima |
| `08_setup_e_balanceamento.md` | Sorteio, draft de terreno, compensação para quem escolhe por último, alavancas de balanceamento, metas numéricas, plano de playtest e simulação |
| `09_versao_web_multiplayer.md` | Como rodar no navegador: arquitetura, salas, convites, protocolo, motor de regras, UI, deploy, roadmap |
| `10_solo_e_variantes.md` | Modo solo contra o Rival, variantes e expansões futuras |
| `11_guia_visual.md` | Direção de arte: paleta, tipografia, ícones, anatomia das cartas, mood por terreno, tokens de UI, diagramas |
| `12_guia_de_prompts_ia.md` | Prompts de IA em folhas (várias cartas por imagem) para todos os decks, script para fatiar e fluxo até a carta pronta |

---

## Glossário rápido (usado em todos os arquivos)

| Ícone | Termo | Significado |
|---|---|---|
| 💰 | **Verba** | Compra cartas. Evapora no fim do turno (exceto o **Tesouro**, até 3) |
| 🔨 | **Obra** | Constrói edifícios na grade. Evapora no fim do turno |
| 🗳️ | **Articulação** | Capital político: compra cartas políticas, paga Obras-Prima. Evapora |
| ⭐ | **Mérito** | Pontos de ascensão. **10 = vitória** (fim da rodada) |
| 🎖️ | **Selo** | Condecoração. 2 Selos = 1 ⭐ |
| 😊 | **Aprovação** | Medidor 0–10 (começa em 5) |
| ☁️ | **Poluição** | Soma dos ☁️ dos seus edifícios (derivada) |
| ⚡ / 💧 | **Energia / Água** | Capacidade menos consumo (derivadas) |
| 👥 | **População** | 2 (Prefeitura) + soma dos 👥 dos edifícios |
| 🕵️ | **Suspeita** | Cubo da sua cor que entra no Saco; vira dano na Fiscalização |
| 🔔 | **Alerta** | Quando entra na Fila Especial, dispara uma Fiscalização |
| 🔧 🌿 💼 ✊ | **Facções** | Tecnocratas, Verdes, Empresários, Sindicatos |
| RES COM IND INF VER SER MON | **Zonas** | Residencial, Comercial, Industrial, Infraestrutura, Verde/Lazer, Serviço, Monumento |

---

## Decisões de design já tomadas

1. **Todos começam com a mesma mão e o mesmo deck de 10 cartas.** A diferença vem do terreno, do mercado e das escolhas.
2. **Mercado de dois níveis**, como em Clank!: 4 pilhas fixas (Padrão) e uma fila de 6 cartas do Deck Especial.
3. **Construir tira a carta do deck e coloca na cidade.** Você troca "carta de ação" por "renda permanente". É a tensão central do jogo.
4. **Sem número fixo de rodadas.** O jogo termina quando alguém chega a ⭐10 (a rodada é completada para ser justa). O deck de Rodada (12 cartas) funciona só como trava de segurança.
5. **Vários caminhos para ⭐**: Metas do Partido, Obras-Prima, Facções, Selos de Auditoria. Ninguém vence só por um caminho.
6. **Risco estilo Clank!**: cartas corruptas dão vantagem rápida, mas colocam cubos 🕵️ no Saco; a Fiscalização puxa cubos e cobra Aprovação.
7. **Draft de terreno com compensação.** Quem escolhe por último recebe um pacote pequeno e joga primeiro na rodada 1.
8. **Jogo digital desde o início**: a cidade tem muita contabilidade (adjacências, capacidade, requisitos), então o motor de regras é pensado para rodar no servidor.

> Convenção: números entre parênteses em tabelas são valores de partida e **devem ser ajustados por playtest/simulação** (ver `08`).
