# GARIMPO — A Cova da Mãe-do-Ouro
### Documento de Design — versão 0.2 (título provisório)

Deck builder de **corrida e fuga** para 1 a 4 jogadores (ideal 3–4, com bots no digital). Cada pessoa é um garimpeiro que desce numa mina abandonada da Serra do Ouro, monta um baralho melhor durante a descida, pega **Relíquias** lá no fundo e tenta **sair vivo** antes que o barulho acorde a **Mãe-do-Ouro**, a serpente de fogo da lenda que guarda o veio.

> Gênero: deck building com tabuleiro de exploração e mecânica de barulho e risco, a mesma família de Clank!, Ascension e Dominion. **Não é uma cópia de nenhum deles:** nome, tema, mapa, cartas, chefe e regras de fim de jogo são nossos.
> Números entre parênteses ou marcados com *(PT)* são valores iniciais e precisam de playtest/simulação, igual ao `08` do MANDATO.


---

## 0. O que mudou na v0.2 (exploração, economia e online)

> A v0.2 transforma o GARIMPO num deckbuilder de **exploração**: a mina não existe no começo, ela é descoberta peça por peça. É a mesma família de jogo do Clank! Catacombs (explorar colocando peças, loja base + loja especial, cubos de barulho, ataque do chefe, sair com relíquia). O conteúdo continua nosso: tema, cartas, peças, números e chefes.

### 0.1 A mina é descoberta durante o jogo
- A mesa começa só com a **Boca da Mina**, o **Barracão** e a **Galeria de Entrada** (logo abaixo da Boca).
- A mina é uma grade em corte: **9 colunas × 5 níveis**. Cada peça de Sala tem saídas para a esquerda, a direita, para cima e para baixo. As saídas podem ser túnel, túnel escuro, trilho, Toca de Bicho, escada, poço ou desabamento.
- **Explorar:** se a sua sala tem uma saída que dá para o escuro, pague o custo dessa passagem (🔦), compre a peça do monte daquela profundidade e escolha de que lado ela vira (espelhar). Depois você entra nela.
- **Montes por profundidade:** raso (níveis 1–2, 14 peças), médio (nível 3, 13) e fundo (níveis 4–5, 12 + Ninho). Monte vazio: compra do mais fundo e, depois, do mais raso.
- **Nível mínimo:** Altar só a partir do nível 2, Jardim de Estátuas no 3, Portão de Bronze no 4 e Ninho só no 5. Se a peça sair mais rasa, ela vai para o fundo do monte e você compra a próxima.
- **Ligações:** ao colocar uma peça, ela se liga a todas as vizinhas já colocadas, se pelo menos uma das duas tiver saída para a outra.
- **Desabamento numa saída:** limpe antes de explorar (⛏3 ou Dinamite).

### 0.2 Salas
| Sala | Efeito |
|---|---|
| Galeria Vazia | nada |
| Respiro | ao entrar, 🫧+1 (uma vez por turno) |
| Geodo | primeira visita: 💠 e 💥2 (2 Cristais por Geodo) |
| Veio de Ouro | primeira visita: +🟡2 |
| Câmara do Eco | ao entrar, 💥1 |
| **Capela Soterrada** | primeira visita: pode destruir 1 carta da mão, do descarte **ou jogada neste turno** |
| **Depósito Abandonado** | primeira visita: ganhe de graça 1 carta da Fila de custo até 🤝4 |
| Mascate | compre itens com 🟡 |
| Poço do Elevador | ligada à Boca por elevador (🤝2, 💥1) |
| **Altar** | ao ser revelada, recebe a próxima Relíquia da pilha da sua profundidade |
| **Ninho** | a Escama da Mãe-do-Ouro (✦35) aparece com ela (está entre as 6 primeiras peças do monte fundo) |

### 0.3 As Relíquias aparecem e sobem de tier
Três pilhas, cada uma do menor para o maior valor. Cada Altar revelado pega a próxima Relíquia da pilha da sua profundidade (se a pilha acabou, usa a de cima):

| Pilha | Relíquias (em ordem) |
|---|---|
| Rasa (níveis 1–2) | Moeda do Império ✦8 → Bateia do Primeiro Garimpeiro ✦10 → Pente de Tartaruga e Ouro ✦12 |
| Média (nível 3) | Lampião de Prata ✦15 → Sino da Capela Soterrada ✦15 → Bússola de Ouro ✦18 |
| Funda (níveis 4–5) | Coroa de Quartzo-Rosa ✦20 → Ferradura de Ouro ✦20 → Olho de Topázio ✦28 → Ídolo da Serra ✦30 |
| Ninho | Escama da Mãe-do-Ouro ✦35 |

Quanto mais a mina é explorada, mais valiosas ficam as Relíquias que aparecem.

### 0.4 Deckbuilding (o centro do jogo)
- **Pontos de compra = 🤝 Prosa.** Você compra na **loja base** (Mercado Fixo: Lampião a Querosene, Cabo da Turma, Mapa do Veio e o Rato-de-Mina, que sempre está lá) ou na **loja especial** (a Fila do Túnel, 6 cartas).
- **Baralho inicial (v0.2):** 5 Barganha (🤝1), 3 Lamparina (🔦1), 1 Picareta Gasta (⛏1), 1 Tropeção (🔦1 · 💥2). O movimento vem das cartas que você compra.
- **A Fila gira:** no fim de cada rodada, a carta mais antiga sai e entra uma nova (pode revelar 🌋 e disparar a Fúria). O mercado não fica parado.
- **Custos ajustados:** Detector 4, Mapa da Galeria 5, Dona Zefa 3, Irmãos Ferreira 5, Cantadeira 4, Capataz 4, Benzedeira 4, Diário 3. A Lanterna de Carbureto ganhou 💥-1.
- **Salas que mexem no baralho:** Capela (destrói), Depósito (carta grátis), Canil da DLC (dá carta).

### 0.5 Fim de jogo (v0.2)
- A água começa quando o primeiro jogador sai ou fica soterrado, **ou quando o Túnel acaba, ou na rodada 16**, o que vier primeiro. A última trava garante que toda partida termina.
- Depois que começou, a água sobe **uma vez por rodada**. São 4 rodadas de folga antes de alagar a Câmara, e depois Câmara, Veio, Galeria 3 e Galeria 2. Quando chega na Galeria 1, a partida acaba.

### 0.6 Ordem dos jogadores
O 1º jogador põe 1 cubo na Bateia e os outros nenhum. Não há mais bônus de 🔦 no primeiro turno. Quem joga primeiro abre as salas que os outros aproveitam, então a posição 1 ainda vence menos (~19%). Isso está nas pendências.

### 0.7 Online
Salas com código de convite, até 4 garimpeiros (vagas livres com bots), opções de DLC e mapa (explorar ou clássico), reconexão pelo mesmo navegador, conversa, revanche e salas que sobrevivem a reiniciar o servidor. O servidor é a autoridade: cada jogador recebe só o que veria na mesa. Ficam escondidos a ordem dos baralhos, as mãos dos outros, os montes de peças, as pilhas de Relíquias e a semente.

> As seções 1 a 8 abaixo descrevem a v0.1. O mapa fixo da seção 4 continua no código como **mapa clássico** (`map: 'classico'`), usado no tutorial e nos testes. Onde a v0.2 muda algo, vale a seção 0.

---

## 1. O que faz o GARIMPO ser diferente

| Ideia | Como funciona |
|---|---|
| **Mapa em corte lateral** | O tabuleiro mostra a montanha cortada ao meio, com 6 níveis de cima para baixo. Subir custa mais que descer. |
| **Fôlego em vez de vida** | Quanto mais fundo, menos ar. Você perde Fôlego para bichos, gás, a Fúria e a água. |
| **Relíquias pesam** | Relíquias de ✦20 ou mais são **pesadas**: cada escada subindo custa **+1 🔦**. O fundo paga mais, mas a volta fica mais lenta. |
| **Adrenalina** | Com uma Relíquia na mão você corre: **+🔦1** no começo de cada turno. |
| **Galerias em zigue-zague** | Cada nível desce pelo lado oposto ao que você chegou. Poços, trilhos, elevador e as escadas do meio (bloqueadas) são os atalhos. |
| **A mina alaga** | Quando alguém sai ou fica soterrado, a água começa a subir um nível por rodada. É o relógio do fim do jogo. |
| **Trilhos e elevador** | Atalhos rápidos e barulhentos: carrinho de mina (anda longe e faz 💥) e o elevador de gaiola (custa 🤝). |

---

## 2. Recursos e ícones

| Ícone | Nome | Uso |
|---|---|---|
| 🔦 | **Luz** | Movimento. Evapora no fim do turno |
| 🤝 | **Prosa** | Compra cartas da Fila e do Mercado Fixo. Evapora |
| ⛏ | **Picareta** | Derrota Bichos, limpa Desabamentos e Grisu. Evapora |
| 💥 | **Estrondo** | Põe cubos da sua cor na **Bateia** (o saco). `💥-1` tira 1 cubo da sua reserva de área |
| 🟡 | **Pepita** | Ouro: vale 1 ponto e é a moeda do **Mascate** |
| 💠 | **Cristal** | 5 pontos. Fica nos Geodos do Veio Profundo |
| 🏺 | **Relíquia** | 10–30 pontos. Uma por nó marcado |
| 🫧 | **Fôlego** | Sua vida: 10 marcadores. Chegou a 0, você fica **soterrado** |
| 🌋 | **Rachadura** | Ícone de carta. Se uma carta com 🌋 entra na Fila, acontece uma **Fúria** no fim do turno |
| ✦ | **Pontos** | Pontos impressos em cartas |

**Área de Estrondo:** o 💥 que você faz durante o turno fica primeiro na sua área (na frente do seu tabuleiro). Efeitos com `💥-X` tiram cubos daí. No fim do turno, o que sobrou vai para a Bateia.

---

## 3. Componentes (versão de mesa e versão 3D)

- 1 tabuleiro em corte lateral (6 níveis, 32 nós)
- 4 garimpeiros (miniaturas) + 4 tabuleiros pessoais
- 30 cubos por cor (4 cores) + 24 **cubos-pedra** pretos (da própria mina)
- 1 **Bateia** (tigela/saco dos cubos)
- 1 miniatura da **Mãe-do-Ouro** + trilha da **Fúria** (6 casas)
- 1 marcador de **Nível d'Água**
- 7 Relíquias, 8 Cristais, 60 Pepitas, 40 Fôlego (bolhas de ar)
- 4 marcadores de **Desabamento**, 4 de **Grisu**
- Mascate: 4 itens × 2 cópias (Capacete com Luz, Corda, Mochila, Cantil de Ar)
- Baralhos: 40 iniciais (10 por jogador), Mercado Fixo (4 pilhas), **Túnel** (48 cartas)

---

## 4. Tabuleiro: a mina em corte

```
NÍVEL 0  SUPERFÍCIE      [S1 Boca]────[S2 Barracão]────[S3 Elevador]
                            │escada                         ║ gaiola (🤝2)
NÍVEL 1  GALERIA 1   A1 Respiro─A2─A3═A4═A5═A6─🐾─A7      ║
                                    ┆x        ↓poço  │escada ║
NÍVEL 2  GALERIA 2   B1─B2─B3 Mascate─B4═B5═B6 Elevador─🐾▓─B7 🏺10
                     │escada ↓poço
NÍVEL 3  GALERIA 3   C1─▓─C2─C3─🐾─C4 🏺15─C5─▓─C6 🏺15
                                 ┆x                     │escada
NÍVEL 4  VEIO        D1💠─D2💠─🐾─D3 🏺20─▓─D4💠─D5 🏺20─▓─D6💠
                     │escada                    │escada estreita
NÍVEL 5  CÂMARA      E1 🏺28 ──── E2 Ninho 🏺35 ──── E3

═ trilho   ▓ túnel escuro   🐾 Toca de Bicho   ┆x escada bloqueada por Desabamento (A4–B4, C3–D3)
Poços: A6 → C5 e B2 → D2 (só descem, pulam um nível)
```

**Passagens (arestas):**

| Passagem | Custo |
|---|---|
| Túnel comum | 🔦1 |
| Escada | descer 🔦1 · subir 🔦2 (+1 por Relíquia pesada, ✦20+) |
| Poço | só desce, 🔦1, pula um nível inteiro, 💥2 |
| Túnel escuro (sombreado) | 🔦2, ou 🔦1 se você jogou uma carta com 🔦2+ neste turno |
| Trilho (carrinho) | 🔦1 para andar até 3 nós no trilho · 💥2 |
| Elevador de gaiola | 🤝2, Superfície ↔ Galeria 2 · 💥1 |
| Toca de Bicho (patinha) | ao atravessar, pague ⛏1 ou perca 🫧1 |
| Desabamento (marcador) | bloqueado; ⛏3 ou Dinamite remove o marcador |

**Nós especiais:** Boca da Mina (saída), Barracão (pague 🤝2 → 🫧+1, uma vez por turno), Respiro (ao entrar, 🫧+1, uma vez por turno), Mascate, Geodo (ao entrar pela primeira vez, pegue 💠 e faça 💥2; cada Geodo começa com 2), Altar de Relíquia, Ninho (Relíquia ✦35: ao pegar, a Fúria avança 2).

---

## 5. Preparação

1. Cada jogador recebe 10 cartas iniciais, 10 🫧, 30 cubos e o garimpeiro na **Boca da Mina**.
2. Embaralhe o Túnel e abra **6** cartas na **Fila**. Se sair 🌋 no setup, troque a carta e embaralhe de volta.
3. Bateia começa com **6 cubos-pedra** pretos.
4. Marcador da Fúria na casa 1. Nível d'Água fora do tabuleiro.
5. Compensação de ordem: o 1º jogador põe 3 cubos na Bateia, o 2º 2, o 3º 1, o 4º nenhum. No primeiro turno, do 2º jogador em diante, cada um ganha **+🔦1**. *(calibrado em simulação: vitórias por posição entre 22% e 28%)*
6. Todos compram 5.

---

## 6. Turno

1. **Jogue as 5 cartas** na ordem que quiser. Os recursos se somam.
2. **Gaste os recursos** em qualquer ordem e combinação:
   - 🔦 mover pelas passagens;
   - 🤝 comprar da Fila ou do Mercado Fixo (a carta vai para o descarte);
   - ⛏ derrotar Bichos da Fila (o Bicho é descartado e você ganha a recompensa) ou limpar marcadores;
   - 🟡 comprar no Mascate quando estiver no nó dele;
   - pegar Relíquia/Cristal ao entrar no nó (Relíquia: **máximo 1 por jogador**, 2 com Mochila).
3. **Fim do turno:**
   - Cubos da sua área de Estrondo vão para a Bateia.
   - Reponha a Fila até 6. Se entrou pelo menos uma carta com 🌋 **ou se você pegou uma Relíquia neste turno**, resolva **uma Fúria** (só uma por turno).
   - Descarte tudo, compre 5 (embaralhe o descarte quando precisar).

### A Fúria da Mãe-do-Ouro
Tire da Bateia o número de cubos da casa atual da trilha:

| Casa | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Cubos *(PT)* | 2 | 3 | 3 | 4 | 4 | 5 |

- Cada cubo de jogador = esse jogador perde **🫧1** (o cubo sai do jogo).
- Cubo-pedra preto = nada acontece; ele volta para a caixa.
- A trilha avança **1** a cada Relíquia pega (2 no Ninho).
- **Bateia vazia:** nada acontece, mas a próxima Fúria tira +1 cubo.

---

## 7. Fim de jogo: a mina alaga

- Ao chegar na **Boca da Mina** carregando ao menos 1 Relíquia, você **sai**: ganha o **Selo de Sobrevivente (✦15)** e não joga mais.
- Quando o **primeiro jogador sai ou fica soterrado**, coloque o marcador d'Água na trilha da água, **três casas abaixo da Câmara** (3 voltas de folga).
- A partir daí, **no começo de cada turno desse jogador** (ele vira o "relógio"), a água sobe **1 casa**. Depois das 3 de folga, ela alaga a Câmara, o Veio, a Galeria 3 e a Galeria 2, nessa ordem.
  - Quem estiver em um nível alagado perde **🫧2** no começo do próprio turno.
  - Quando a água chega na **Galeria 1**, quem ainda está dentro da mina fica soterrado. Fim de jogo.
- O jogo também termina quando todos saíram ou ficaram soterrados.

### Soterrado (🫧 0)
| Onde | Resultado |
|---|---|
| Superfície ou Galeria 1 | A turma de resgate te puxa: você pontua tudo, só não ganha o Selo |
| Galeria 2 ou mais fundo | Você pontua **metade** (arredonde para baixo) e as Relíquias valem 0 |

### Pontuação
Pepitas (1 cada) + Cristais (5) + Relíquias + ✦ das cartas do baralho + Selo de Sobrevivente + itens do Mascate (Mochila e Capacete valem ✦3 cada). Em caso de empate, vence quem tiver mais 🫧.

---

## 8. Cartas

### 8.1 Baralho inicial (10, igual para todos)
| Qtd | Carta | Efeito |
|---|---|---|
| 4 | **Lamparina** | 🔦1 |
| 4 | **Barganha** | 🤝1 |
| 1 | **Picareta Gasta** | ⛏1 |
| 1 | **Tropeção** | 🔦1 · 💥2 |

### 8.2 Mercado Fixo (sempre disponível)
| Carta | Custo | Efeito |
|---|---|---|
| **Lampião a Querosene** | 🤝3 | 🔦2 |
| **Cabo da Turma** | 🤝3 | ⛏2 |
| **Mapa do Veio** | 🤝7 | ✦7 (sem efeito ao jogar) |
| **Rato-de-Mina** *(Bicho fixo)* | ⛏2 | +🟡1, não sai do mercado |

### 8.3 Túnel (48 cartas, 30 tipos) *(PT)*

**Ferramentas**
| Qtd | Carta | Custo | Efeito | ✦ |
|---|---|---|---|---|
| 3 | Lanterna de Carbureto | 🤝3 | 🔦2 | |
| 3 | Picareta de Aço | 🤝3 | ⛏2 | |
| 2 | Corda de Sisal | 🤝2 | 🔦1 · neste turno, subir escada custa 🔦1 | |
| 2 | Capacete Amassado | 🤝2 | ⛏1 · 💥-1 | |
| 2 | Dinamite 🌋 | 🤝4 | ⛏4 · 💥3 · pode remover Desabamento | |
| 2 | Bateia de Prata | 🤝4 | +🟡2 | 1 |
| 1 | Detector de Veio | 🤝5 | compre 2 · no Veio Profundo, +💠1 | 1 |
| 2 | Carrinho Desgovernado | 🤝3 | ande até 3 nós de trilho grátis · 💥1 | |
| 1 | Mapa da Galeria Esquecida | 🤝6 | 🔦1 · túneis escuros custam 🔦1 neste turno | 3 |

**Companheiros**
| Qtd | Carta | Custo | Efeito | ✦ |
|---|---|---|---|---|
| 1 | Seu Tião, o Guia | 🤝5 | 🔦2 · compre 1 | 2 |
| 1 | Dona Zefa, Cozinheira | 🤝4 | 🫧+2 · 🤝1 | |
| 2 | Mascate Ambulante | 🤝4 | 🤝3 · ao adquirir, +🟡1 | |
| 1 | Irmãos Ferreira | 🤝6 | ⛏3 · 🔦1 | 2 |
| 2 | Moleque Ligeiro | 🤝3 | 🔦1 · compre 1 | |
| 1 | Cantadeira de Moda | 🤝5 | 🤝1 · 💥-3 | 1 |
| 1 | Capataz Arrependido | 🤝5 | 🤝2 · ganhe 1 carta de custo ≤3 da Fila | |
| 1 | Benzedeira | 🤝5 | destrua 1 carta da mão ou do descarte · 🫧+1 | |
| 2 | Contrabandista 🌋 | 🤝3 | 🤝3 · 💥2 | |

**Achados**
| Qtd | Carta | Custo | Efeito | ✦ |
|---|---|---|---|---|
| 2 | Pepita Encravada | 🤝5 | +🟡1 | 4 |
| 1 | Fóssil de Preguiça-Gigante | 🤝6 | ao adquirir, 💥2 | 5 |
| 1 | Diário do Engenheiro | 🤝4 | compre 2, descarte 1 | 1 |
| 2 | Ouro-de-Tolo | 🤝2 | ao adquirir, +🟡3 · ao jogar, 💥1 | 0 |

**Bichos** (não se compram: derrote com ⛏ enquanto estão na Fila)
| Qtd | Bicho | ⛏ | Recompensa |
|---|---|---|---|
| 3 | Morcego-Vampiro | 2 | +🟡1 · 🔦1 |
| 2 | Aranha-Caranguejeira | 3 | +🟡2 |
| 2 | Cobra-Cega | 2 | compre 1 |
| 1 | Lobisomem do Turno da Noite 🌋 | 5 | +🟡4 · ✦ vai para seu baralho como troféu (✦3) |
| 1 | Boitatá Filhote 🌋 | 4 | +💠1 · 💥2 |
| 1 | Corpo-Seco | 4 | +🟡3 · **ao entrar na Fila:** todos perdem 🫧1 |

**Perigos** (resolvem ao entrar na Fila)
| Qtd | Perigo | Efeito |
|---|---|---|
| 2 | Grisu | Ponha um marcador de Grisu num nó da Galeria 3 ou abaixo (quem for o próximo jogador escolhe). Entrar nele custa 🫧1. ⛏2 remove. A carta é descartada. |
| 1 | Infiltração | Água ativa: sobe 1 nível agora. Senão, todos fazem 💥1. Descartada. |
| 2 | Rachadura 🌋 | Só dispara a Fúria. Descartada. |

### 8.4 Mascate (paga com 🟡, uma compra por visita)
| Item | 🟡 | Efeito |
|---|---|---|
| Capacete com Luz | 5 | +🔦1 todo turno · ✦3 |
| Corda Nova | 4 | escadas sem o +1 das Relíquias |
| Mochila | 6 | carregue 2 Relíquias · ✦3 |
| Cantil de Ar | 3 | 🫧+3 na hora (descartável) |

### 8.5 Relíquias
| Nível | Relíquia | ✦ |
|---|---|---|
| G2 | Bateia do Primeiro Garimpeiro | 10 |
| G3 | Lampião de Prata · Sino da Capela Soterrada | 15 · 15 |
| Veio | Coroa de Quartzo-Rosa · Ferradura de Ouro | 20 · 20 |
| Câmara | Olho de Topázio | 28 |
| Ninho | Escama da Mãe-do-Ouro | 35 |

---

## 9. Versão digital (reaproveitando o MANDATO)

| Peça | De onde vem |
|---|---|
| Motor de regras puro (`engine.js`), testes `rules.mjs` / `sim.mjs` | Mesmo padrão do `frontend/src/mandato/` |
| Bots por nível | Base do `bot.js`: avaliar corrida vs. risco (Fôlego, água, Relíquias) |
| Mesa 3D | `Table3D.jsx` + `TableFurniture.jsx` (mesma mesa, outro tabuleiro em cima) |
| Online | Salas, convite e reconexão do `server/` |
| Modelos | GLB único `garimpo.glb` com os nomes da lista de assets do `01` |

O grafo do mapa (32 nós e arestas com tipo/custo) fica em `data.js`. Cada nó tem `lv` (nível) e `x` (0–10) para posicionar o garimpeiro no tabuleiro 3D.

**Já existe** em `frontend/src/garimpo/`: `data.js`, `engine.js` (regras base + DLCs), `bot.js`, `test/rules.mjs` (`npm run test:garimpo`) e `test/sim.mjs` (`npm run sim:garimpo -- 500 4 cerbero,medusa`). Ainda falta a interface e a mesa 3D.

## 10. Simulação e balanceamento (v0.2, mapa explorado)

Bots, 500 partidas, 4 jogadores:

| Modo | Rodadas | Saem vivos | Soterrados fundo | Ninho aparece e é pego | Vitórias por posição |
|---|---|---|---|---|---|
| Base | 10,6 | 77% | 13% | 5% | 19 / 26 / 26 / 30% |
| + Cérbero | 11,0 | 75% | 14% | 6% | 19 / 23 / 30 / 29% |
| + Medusa | 10,9 | 77% | 13% | 10% | 20 / 24 / 30 / 27% |
| + as duas | 11,3 | 73% | 13% | 10% | 15 / 23 / 32 / 31% |

Por partida: ~17 salas descobertas, primeira saída na rodada ~4,3 e ~3,7 compras por jogador.

**Pendências de balanceamento:**
- **O deckbuilding ainda é raso.** São ~3,7 compras por jogador, e o Lampião a Querosene está em ~94% dos baralhos vencedores. Próximos passos: mais cartas baratas e boas na Fila, mais motivos para ficar na mina (Cristais, cartas de ponto), um bot que compra melhor e testar 🤝6 de início com 6 Barganhas.
- **Saída cedo:** a primeira saída é na rodada ~4, com Relíquia de ✦8–12. Testar Selo maior para Relíquias de tier médio ou alto, ou Altar raso só no nível 2 do lado oposto à entrada.
- **Ninho:** quase ninguém chega lá (5–10%), e quem chega quase sempre vence. Testar Ninho mais acessível (entre as 4 primeiras peças do monte fundo).
- **Posição 1** vence ~19%: compensar quem abre o mapa (ex.: 🟡2 ou 1 carta grátis da Fila no primeiro turno).
- Com 2 jogadores, o Ninho continua forte demais.
