# 02 — Regras Completas e Estrutura de Turno

## 1. Objetivo

Chegue a **⭐10 Mérito** antes dos outros. Quando alguém alcança ⭐10, a **rodada atual é completada** (para todos jogarem o mesmo número de turnos) e vence quem tiver **mais ⭐**. Desempate: maior 😊 → menor ☁️ → maior Tesouro → vitória compartilhada.

**Trava de segurança:** se o deck de Rodada acabar (12 cartas), a rodada 12 é a última e o jogo termina com o mesmo critério.

## 2. Componentes (por jogador)

- 1 **tabuleiro de terreno** (grade 4x4 + painel de medidores).
- 1 **deck inicial** de 10 cartas (`05`).
- 10 **cubos 🕵️** da sua cor (estoque).
- Marcadores: Aprovação, Mérito, Facções (4), Tesouro.
- 1 slot de **Gabinete** com 2 espaços para Decretos.

Compartilhados: tabuleiro principal (`03`), Mercado Padrão (`06`), Deck Especial (`07`), Obras-Prima, Metas, deck de Rodada, Saco de cubos, Selos.

## 3. Recursos de turno

| Recurso | Para que serve | Persiste? |
|---|---|---|
| 💰 **Verba** | Comprar cartas | **Tesouro:** guarde até 3 💰 de um turno para o outro (Aliança dos Empresários e a carta *Diretor Financeiro* aumentam). O resto evapora |
| 🔨 **Obra** | Construir, demolir, melhorar | Evapora |
| 🗳️ **Articulação** | Comprar Intrigas/cartas políticas, pagar Obras-Prima, trocar Selos | Evapora |

Recursos vêm de **cartas jogadas** e de **edifícios** (Renda no início do turno).

## 4. Medidores da cidade

| Medidor | Faixa | Como funciona |
|---|---|---|
| 😊 **Aprovação** | 0–10, começa em 5 | Marcador. **≥8:** +🗳️1 no início do turno. **≤2: Protestos**, você compra só 4 cartas no fim do turno |
| ☁️ **Poluição** | Derivada | Soma dos ☁️ dos edifícios (Verdes têm ☁️ negativo). **≥6:** −1 😊 no fim de cada rodada. **≥9:** também −💰1 de Renda por turno (Smog) |
| ⚡ **Energia** | Derivada | Capacidade (base do terreno + Infra) − Consumo dos edifícios |
| 💧 **Água** | Derivada | Idem |
| 👥 **População** | Derivada | 2 (Prefeitura) + soma de 👥 dos edifícios |

**Déficit de ⚡/💧:** no início do turno, cada unidade faltante = −1 😊 (máximo −3 por turno).
**Requisito de 👥 (Req):** edifícios COM/IND só **produzem** se 👥 total ≥ Req. Caso contrário ficam *inativos* (continuam construídos).
**Aprovação 0 → Crise de Governo:** −1 ⭐ (mínimo 0), 😊 volta a 3 (no máximo 1 vez por rodada).

## 5. Estrutura da partida

```
PREPARAÇÃO (08) → [ RODADA ] × N → FIM
```

### 5.1 A Rodada

1. **Revelar Carta de Rodada:** aplica o **Evento** (e mostra a **Auditoria** que será resolvida no fim).
2. **Turnos:** cada jogador, na ordem a partir do **Token de Primeiro Jogador**, faz 1 turno.
3. **Fim de Rodada:**
   1. Resolver **Auditoria** (1º → 🎖️1 e +💰1 no Tesouro; 2º → +💰1 no Tesouro; empate: todos os empatados recebem a recompensa de 2º).
   2. Efeitos de fim de rodada (Poluição ≥6, Posto de Saúde, Olho do Partido…).
   3. Converter Selos opcionalmente (2🎖️ → ⭐1).
   4. Atualizar **Tensão** (sobe +1 no início das rodadas 4, 7 e 10).
   5. Passar o Token de Primeiro Jogador no sentido horário.
   6. Se alguém tem ⭐10 → **fim de jogo**.

### 5.2 O Turno

**Fase 1: Início**
1. **Renda:** some na sua reserva de turno: Prefeitura (💰1) + Renda de cada edifício ativo + Decretos + Tesouro guardado.
2. **Déficits:** aplique −😊 por ⚡/💧 faltantes.
3. **Popularidade:** se 😊 ≥ 8, +🗳️1.

**Fase 2: Ação** (qualquer ordem, quantas vezes puder pagar)

- **Jogar cartas** da mão: aplique efeito (recursos, compras, etc.). Cartas com ícone de Facção avançam +1 a trilha.
- **Comprar** (💰/🗳️): do Mercado Padrão ou da Fila Especial → vai para o **descarte**.
- **Construir** (🔨): posicione uma Edificação da mão em uma casa vazia da grade (seção 6).
- **Melhoria:** construa sobre um edifício da mesma zona (seção 6.3).
- **Demolir** (🔨1): remove um edifício; a carta vai para o **descarte** (volta ao ciclo do deck).
- **Vender Lote:** jogue uma Edificação da mão por 💰1; vai para o descarte.
- **Obra-Prima:** pague o custo (💰🔨🗳️) e construa **direto da vitrine** (seção 8).
- **Reivindicar Meta:** se cumprir os requisitos *agora*, pegue a Meta (máx. **1 por turno**).
- **Trocar Selos:** 2🎖️ → ⭐1.
- **Decretos:** jogue um Decreto da mão no Gabinete (2 espaços; substituir exila o antigo).
- **Intrigas:** máx. **1 por turno**.

**Fase 3: Fim**
1. Descarte a mão e tudo que jogou.
2. Guarde até 3 💰 no Tesouro; o resto evapora (🔨 e 🗳️ sempre evaporam).
3. Compre 5 cartas (4 se Protestos; 6 com Grande Biblioteca). Se o deck acabar, embaralhe o descarte.

> **Planejamento paralelo:** como a mão é comprada no fim do seu turno, você já sabe sua mão durante os turnos dos outros.

## 6. Construção

### 6.1 Edificações
Cada carta de Edificação mostra: **Aq** (custo de compra), **Ob** (custo de obra), **Zona**, **Cons** (consumo ⚡💧), **Req** (👥 mínima), **efeito/Renda** e **☁️**.

**Construir:** pague Ob, posicione a carta na grade. **A carta sai do seu deck** até ser demolida. Se a casa tem restrição de terreno (Orla, Encosta, Floresta…), pague os custos do terreno (`04`).

### 6.2 Adjacência
Vizinhança é **ortogonal** (cima, baixo, esquerda, direita), sem diagonais. Ilha: só dentro da mesma ilha (ou ligada por Balsa/Ponte).

### 6.3 Melhoria
Cartas marcadas **Melhoria de [Zona]** podem ser construídas *sobre* um edifício da mesma Zona: pague Ob −1 (mínimo 1). A carta antiga vai para o **descarte**.

### 6.4 Loteamento (carta genérica)
Ao construir um **Loteamento** escolha a Zona:

| Zona | Ob | Efeitos |
|---|---|---|
| RES | 🔨1 | 👥+2; Cons ⚡1💧1 |
| COM | 🔨1 | Renda 💰1; Cons ⚡1; Req 👥4 |
| IND | 🔨2 | Renda 🔨2; ☁️1; Cons ⚡2; Req 👥6 |
| INF | 🔨2 | ⚡+2 (☁️1) **ou** 💧+2 |

## 7. Mercado

### 7.1 Mercado Padrão (4 pilhas fixas)
Sempre disponíveis. Veja `06`.

### 7.2 Fila Especial (6 cartas)
Quando alguém compra uma carta da Fila, **reponha imediatamente** do topo do Deck Especial. Se a carta reposta tem 🔔 → **Fiscalização imediata**.

O Deck Especial é montado em camadas: Tier III embaixo, Tier II no meio, Tier I em cima (`07`). A Fila "envelhece" com o tempo.

### 7.3 Compra
Pague o **Aq**; a carta vai ao **descarte**. Cartas **Intriga** são pagas em 🗳️. **Decretos** vão ao descarte; ao jogá-los você os coloca no Gabinete.

## 8. Obras-Prima

Vitrine com **3 Obras-Prima** (4 com 5–6 jogadores). Para construir: pague 💰🔨🗳️ indicados e posicione na grade (ignora o deck). Dá ⭐2 imediatamente.
**Legado:** no máximo **2 Obras-Prima por jogador dão ⭐**; a terceira e as demais só dão o efeito.

## 9. Facções

Quatro trilhas **0–6** compartilhadas, cada jogador com um marcador por trilha.

- **Avançar:** jogue uma carta com o ícone → +1 na trilha. Alguns efeitos avançam diretamente.
- **Marco 3:** na primeira vez que chegar a 3 numa Facção, ganhe ⭐1 (uma vez por Facção por jogador).
- **Aliança:** quem tiver ≥5 e for o **único mais alto** pega o token da Facção: ⭐1 e bônus (`03`). Se for ultrapassado estritamente, o token passa (e o ⭐ também). Empate não toma o token.

## 10. Metas do Partido

5 Metas ficam viradas na mesa (4 com 1–2 jogadores, 6 com 5–6). Cada Meta tem 2 vagas: **Ouro (⭐2)** para o primeiro que cumprir e **Prata (⭐1)** para o segundo. Máx. **1 Meta por turno**. Quando as 2 vagas estiverem tomadas, reponha com carta nova.
Cada jogador também tem uma **Meta Regional** privada (⭐2) conforme o terreno (`04`).

## 11. Suspeita, Saco e Fiscalização

- **Suspeita 🕵️:** cartas corruptas mandam cubos da sua cor para o **Saco**.
- **Saco:** começa com **cubos neutros** (6 + 1 por jogador acima de 2; ex.: 8 com 4 jogadores).
- **Fiscalização:** sorteie do Saco **Tensão** cubos (3 nas rodadas 1–3; 4 nas 4–6; 7–9: 5; 10+: 6).
  - Cubo neutro → volta ao Saco.
  - Cubo de jogador → o dono perde **1 😊** e o cubo volta ao **estoque** dele.
  - Se um jogador tomar **≥3** cubos de uma vez: **Investigação**: −1 ⭐ (mínimo 0) e ele não pode reivindicar Metas na rodada atual.
- **Olho do Partido (⭐6+):** no fim de cada rodada você coloca +1 🕵️ no Saco.
- **Alvo Nacional (⭐8+):** Intrigas que o têm como alvo custam −1 🗳️ para os outros.

## 12. Intrigas

Cartas de efeito único (exiladas depois de usadas), compradas com 🗳️. Limites:
- Máx. **1 por turno por jogador**.
- Não pode mirar o mesmo jogador **duas vezes seguidas** (rodada atual e anterior).
- Quem está com 😊 ≤ 2 não pode ser alvo de efeitos que reduzam 😊.
- **Contra-Inteligência** é uma *Reação* e cancela uma Intriga contra você.

## 13. Casos especiais (FAQ)

- **Deck vazio no meio da compra:** embaralhe o descarte e continue.
- **Posso construir sem ter a carta?** Só Obra-Prima direta da vitrine e *Ministro de Obras* (Obra Expressa).
- **Edifício inativo (Req não cumprido):** conta como construído para Metas; só não produz.
- **Edifício "inativo" por evento:** não produz nem fornece capacidade até o fim do efeito.
- **Verde em tile Orla/Floresta:** efeitos de ☁️ somam normalmente.
- **Metas vs. estado atual:** são verificadas **no momento de reivindicar**.
- **Quem foi ⭐10 na rodada:** o jogo só acaba no Fim de Rodada.
- **2 jogadores:** Vitória em ⭐10, mas 4 Metas; neutros 6.

## 14. Exemplo de turno (jogador com Terreno Litoral, rodada 4)

**Situação:** ⭐2, 😊6, 👥8, Tesouro 1💰. Edifícios: Prefeitura, Moradia Popular, Mercadinho (Orla), Lote COM. Mão: Orçamento, Orçamento, Orçamento, Mão de Obra, Lote.

1. **Início:** Renda: Prefeitura 💰1 + Mercadinho 💰1 (+1 por RES adjacente) + Lote COM 💰1 + turismo da Orla +1 + Tesouro 1 = **💰5**.
2. **Ação:** joga Orçamento ×3 (+💰3 = **💰8**) e Mão de Obra (**🔨1**). Constrói o Lote como RES (🔨1) numa casa adjacente ao Mercadinho: 👥 sobe para 10 e o Mercadinho ganha +💰1 na próxima Renda.
3. Compra **Conjunto Habitacional** da Fila (💰3) e **Licitação** (💰3). Sobram 💰2: compra *Loteamento*.
4. **Fim:** nada a guardar além de 💰0. Descarta, compra 5.

*Resultado do turno:* uma construção, três cartas novas, 😊 intacta.
