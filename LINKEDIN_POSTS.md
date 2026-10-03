# Posts de LinkedIn (rascunhos)

Gerados com a `hormozi-hooks` a partir dos projetos já publicados no portfólio.
Só usam fatos que estão em `frontend/src/data/projects.js`. Troque os trechos
entre [colchetes] por números reais antes de postar.

Fórmula dos hooks: QUEM + RESULTADO + VELOCIDADE/FACILIDADE + REMOÇÃO DE OBJEÇÃO.

---

## 1. Contrário (detecção de vazamentos)
**Hook:** "Mais dados não reduzem alarme falso em duto. Entender o fluido reduz."

Trabalho com detecção de vazamentos em minerodutos e rejeitodutos.
Polpa mineral é fluido não-newtoniano: o comportamento muda com a concentração
e a vazão. Se o modelo ignora isso, ele grita lobo toda semana e a operação
para de confiar.

Calibrar o modelo com reologia, perda de carga e transiente fez o sistema
[reduzir os falsos alarmes em X%].

Quem opera duto sabe o custo de um alarme que ninguém acredita mais.

Portfólio: [link]

---

## 2. Número (TEP-Sentinel)
**Hook:** "FAR de 0,69% em detecção de anomalias numa planta química virtual."

Construí o TEP-Sentinel sobre o Tennessee Eastman Process, o benchmark clássico
da engenharia química.

Arquitetura Sense → Think → Act → Explain:
- Sense: 52 variáveis de processo em tempo real
- Think: autoencoder para anomalia, CNN-LSTM para diagnóstico (92% de precisão média em causa raiz)
- Act: Reinforcement Learning para a ação de controle
- Explain: IA generativa traduz a decisão para o operador

Relatório técnico completo no portfólio: [link]

---

## 3. Callout (para recrutador de processos/dados)
**Hook:** "Se seu time tem dados de processo e poucas ferramentas em cima deles, esse post é pra você."

Sou estudante de Engenharia Química na UFMG, estagiário em engenharia de
processos e desenvolvedor.

O que costuma faltar não é dado. É alguém que converse com a operação e com a TI.

Eu entrego do diagnóstico até a ferramenta funcionando. 8 projetos publicados
para você conferir: [link]

---

## 4. Efeito de esforço (HydroCalc / IndustrialEco)
**Hook:** "Troquei horas de planilha por um resultado instantâneo."

Dimensionamento de bomba e equipamentos de controle de poluição costumam viver
em planilhas pesadas. Transformei esses cálculos em aplicações web
(HydroCalc Pro e IndustrialEco): o engenheiro digita as condições e o resultado
aparece na hora.

Planilha é ótima para pensar. Para repetir cálculo 50 vezes, vale virar ferramenta.

[link]

---

## 5. Como eu (AI Data Bridge)
**Hook:** "Como fazer perguntas ao banco de dados em linguagem natural, sem esperar o time de dados."

O AI Data Bridge usa LLM + RAG para converter pergunta em SQL e devolver
a resposta com gráfico. Em vez de horas esperando um relatório, a resposta
chega em milissegundos.

Stack: FastAPI, Next.js, Vanna.ai, PostgreSQL.

[link]

---

## 6. Estudo de viabilidade (CCPR)
**Hook:** "Antes de construir uma linha de produção, vale responder: dá retorno?"

No estágio na fábrica de rações da CCPR, mapeei processos e fiz o estudo de
viabilidade para uma nova linha. Decisão de investimento com número, não com palpite.

Relatório em PDF no portfólio: [link]
