# GARIMPO — Expansões (DLCs)

Módulos opcionais que entram por cima do jogo base. Podem ser usados juntos.
No código: `newGame({ players, dlc: ['cerbero', 'medusa'] })`.

**Na v0.4, cada DLC traz peças de mina (com várias salas) que entram no monte do Fundo:** a peça do chefe entra entre a 3ª e a 9ª peça do Fundo, e as peças temáticas são embaralhadas no meio das outras. O chefe só entra em jogo quando a sala dele é revelada. Sem níveis, a **Medusa** anda até 2 salas por Fúria na direção do garimpeiro mais perto e olha até 3 salas pelos túneis (túnel apertado e desabamento bloqueiam a visão).

**Como era na v0.2:**

| DLC | Sala do chefe (sempre entra) | Salas temáticas (podem ou não aparecer) |
|---|---|---|
| Cérbero | **Portão de Bronze** (monte fundo, nível 4 ou mais). O Cérbero só entra em jogo quando ela é revelada | **Canil Abandonado** (monte raso ou médio): primeira visita, ganhe um Osso Gigante |
| Medusa | **Jardim de Estátuas** (monte médio ou fundo, nível 3 ou mais). A Medusa desperta quando ela é revelada | **Salão dos Espelhos** (médio): ao entrar, ganhe um espelho · **Pedreira de Pedra-Sabão** (raso): ao entrar, destrua 1 Petrificado |

As Relíquias das DLCs entram nas pilhas: a Coleira de Bronze (✦25) na funda e o Véu da Górgona (✦20) na média.
O Cérbero volta ao Portão de Bronze quando é enfrentado. A Medusa, quando é afastada, vai para o Ninho (ou para o Jardim, se o Ninho ainda não apareceu). Simulação: `npm run sim:garimpo -- 500 4 cerbero,medusa`.

> Cérbero e Medusa vêm da mitologia grega (domínio público). As regras, cartas e nomes abaixo são nossos. Não são cópia das expansões de nenhum outro jogo.

**Mote das expansões:** a mina cavou fundo demais e abriu passagem para coisas mais velhas que a Mãe-do-Ouro. Gente de fora (um mascate grego, um escultor de pedra-sabão de Ouro Preto) desceu atrás delas.

---

## DLC 1 — Cérbero, o Cão do Portão

Um cão de três cabeças dorme no **Covil** (nó E3, na Câmara). Ele persegue quem carrega Relíquias.

### Componentes
- 1 miniatura do Cérbero + 3 marcadores de **cabeça** (lado dormindo / lado acordado)
- Relíquia nova: **Coleira de Bronze** (✦25), no Covil
- 8 cartas novas no Túnel

### Regras
| Situação | O que acontece |
|---|---|
| **Começo** | Cérbero no Covil com as 3 cabeças dormindo |
| **Cada Fúria** | Acorda **1 cabeça** (máx. 3). Depois ele anda **1 nó por cabeça acordada** em direção ao garimpeiro mais perto **com Relíquia**. Se ninguém tem Relíquia, vai atrás do mais perto na Galeria 2 ou mais fundo |
| **Mordida** | Se o Cérbero para no seu nó (ou você entra no nó dele com alguma cabeça acordada): **🫧-1**. Uma mordida por pessoa por Fúria |
| **Acalmar** | Pague **🤝4** (ou use uma carta que acalma): 1 cabeça volta a dormir. Com 0 acordadas ele não anda nem morde |
| **Enfrentar** | No nó dele ou ao lado, pague **⛏7**: ele volta ao Covil com tudo dormindo. Você ganha 🟡3 e a carta-troféu **Coleira do Cérbero** (✦4) |
| **Movimento** | Ele usa túneis, escadas e poços nos dois sentidos. Não usa o elevador e não passa por desabamento |

### Cartas
| Qtd | Carta | Custo | Efeito | ✦ |
|---|---|---|---|---|
| 2 | Bolo de Mel | 🤝3 | 💥-1 · acalma 1 cabeça | |
| 1 | Viola de Três Cordas | 🤝5 | 🤝2 · acalma 1 cabeça | 1 |
| 2 | Osso Gigante | 🤝4 | ⛏1 · pode jogar o osso: o Cérbero recua 2 nós em direção ao Covil | 1 |
| 2 | Uivo Triplo *(Perigo)* | — | Ao entrar na Fila: acorda 1 cabeça | |
| — | Coleira do Cérbero *(troféu)* | — | — | 4 |

---

## DLC 2 — Medusa, a Górgona do Veio

A Medusa anda pelas fendas da rocha entre os níveis. Quem ela olha começa a virar pedra: o baralho fica pesado de cartas inúteis.

### Componentes
- 1 miniatura da Medusa
- Relíquia nova: **Véu da Górgona** (✦20), em C2 (Galeria 3)
- 7 cartas novas no Túnel + pilha de cartas **Petrificado**

### Regras
| Situação | O que acontece |
|---|---|
| **Começo** | Medusa em D4 (Veio Profundo) |
| **Cada Fúria** | Ela sobe ou desce **1 nível** em direção ao nível com mais garimpeiros (empate: o mais fundo), parando no nó mais perto de onde estava. Depois, **olha** |
| **Olhar** | Ela vê até **3 nós** pelos túneis do próprio nível. **Túnel escuro e desabamento bloqueiam a visão.** Quem ela vê ganha 1 carta **Petrificado** no descarte. Se você está **no mesmo nó** dela, também perde **🫧1** |
| **Espelho** | Se você jogou uma carta de espelho, o próximo olhar que te pegaria é refletido (não acontece nada) |
| **Afastar** | No nó dela ou ao lado, pague **⛏6**: ela volta para o Ninho (E2). Você ganha 💠2 e a carta-troféu **Escama da Górgona** (✦4) |
| **Petrificado** | Carta sem efeito que vale **✦-1**. Sai do baralho com a Benzedeira ou o Escultor |

### Cartas
| Qtd | Carta | Custo | Efeito | ✦ |
|---|---|---|---|---|
| 2 | Espelho de Bronze | 🤝4 | ⛏1 · espelho | |
| 2 | Venda nos Olhos | 🤝2 | 🔦1 · espelho · 💥1 | |
| 1 | Escultor de Pedra-Sabão | 🤝4 | 🤝2 · destrói 1 Petrificado da mão ou do descarte | 1 |
| 2 | Olhar da Górgona *(Perigo)* | — | Ao entrar na Fila: a Medusa olha na hora | |
| — | Petrificado | — | sem efeito | -1 |
| — | Escama da Górgona *(troféu)* | — | — | 4 |

---

## Como ficou na simulação (bots, 4 jogadores, 400–500 partidas)

| Modo | Turnos | Saem vivos | Soterrados fundo | Quem pega o Ninho vence |
|---|---|---|---|---|
| Base | 10,3 | 70% | 24% | 45% |
| + Cérbero | 10,2 | 66% | 25% | 39% |
| + Medusa | 10,3 | 65% | 30% | 22% |
| + as duas | 10,0 | 75% | 20% | 22% |

Leitura: as DLCs deixam o jogo um pouco mais duro sem mudar a duração. A Medusa pune quem desce fundo (o Petrificado deixa a volta lenta). O Cérbero faz menos gente arriscar o Ninho (24% das partidas, contra 35% no base). Com as duas juntas, os bots ficam mais cautelosos e mais gente sai viva.

**Ajustes já feitos na simulação:** a mordida caiu de 🫧2 para 🫧1. O olhar só tira 🫧 de quem está no mesmo nó e tem alcance de 3. Uivo e Olhar deixaram de ter 🌋 (antes acionavam o efeito duas vezes).

---

## Ideias para próximas expansões (só conceito)

| Nome | Ideia em uma linha |
|---|---|
| **Curupira** | Uma entidade da mata invade a Galeria 1 com raízes: troca o sentido de 2 passagens por rodada ("pés virados") |
| **A Mina Alagada** | Lado B do tabuleiro: começa com a Câmara alagada, tem barcos no lugar dos trilhos e Relíquias que boiam e mudam de nó |
| **Modo Solo: o Capataz** | Um capataz-robô desce junto, pega Relíquias por um roteiro de cartas e marca pontos como um rival |
