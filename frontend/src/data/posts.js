const posts = [
    {
        slug: 'claudio-vai-roubar-seu-emprego',
        category: 'IA & Sociedade',
        date: '06/06/2026',
        title: 'Cláudio Vai Roubar Seu Emprego?',
        summary: 'Volta e meia eu converso com um amigo na academia sobre como a Inteligência Artificial vai roubar todos os empregos. Ficamos desanimados, pensando em um futuro cyberpunk caótico. Proponho o seguinte debate: será realmente que o nosso amigo Cláudio vai usurpar a fonte de renda de todos?',
        content: `
<p>Volta e meia eu converso com um amigo na academia sobre como a Inteligência Artificial vai roubar todos empregos técnicos, comerciais e até manuais. Ficamos desanimados, pensando em um futuro cyberpunk caótico, onde ninguém tem absolutamente nenhum tipo de propriedade e se diverte com entretenimento idiota. Apesar de já vivermos nesse futuro, proponho o seguinte debate a seguir: será realmente que o nosso amigo Cláudio vai usurpar a fonte de renda de todos?</p>

<p>Para começar, eu não sou nenhum expert de LLM, Inteligência Artificial ou sequer Machine Learning, é tudo um chutometro baseado em empirismo. Sim eu sou um viciado crônico em LLMs, tudo começou quando percebi que não precisava mais passar horas para escrever artigos e textos na universidade, que só precisava guiar um Chatbot e conferir no final. Foi gratificante ver que os textos do GPT conseguiam alcançar +20% da nota do que textos escritos por um mero aspirante a engenheiro.</p>

<p>Isso era 2023 e a IA era bem "fraquinha", os modelos eram bem burros e precisavam de <strong>--CONTEXTO--</strong> bem definido (Sim a palavra <strong>--CONTEXTO--</strong> sempre merece um destaque especial ao se tratar de LLMs). Um tempo se passou e eu estava usando os chatbots para me introduzir materiais novos e ajudar com problemas da vida. Mais um tempo passou e eu estava usando no trabalho. Depois de alguns meses, bom, eu uso para tudo. E sim os webchats são a forma mais comum de uso de IA, mas é definitivamente a pior. Logo abaixo vou colocar uma imagem do Funil/Pirâmide de IA. Se você continua no nível 1, eu recomendo fortemente investir tempo e dinheiro para aprender o nível 2, independentemente se você é um C-level, ou um pedreiro. E caso isso tenha ROI - CONTINUE DESCENDO DE NÍVEL.</p>

<figure>
    <img src="/images/blog/ia-funil.png" alt="O Poço Sem Fundo — Funil/Pirâmide de uso de IA" />
    <figcaption>O Poço Sem Fundo — Funil/Pirâmide de uso de IA</figcaption>
</figure>

<p>Após essa breve historinha (vão ter mais daqui a pouco), voltamos a pergunta: isso ai vai roubar meu emprego?</p>

<p>A resposta é sim e não. Gosto de fazer a seguinte comparação, a IA é a máquina de tear da pós contemporaneidade. A máquina de tear acabou com o artesanato na Inglaterra? Deixou grande parte que fazia bem pobre, mas trouxe escala e produtividade geral. A máquina de tear foi uma bolha? Não. Inteligência artificial também não é uma bolha, também traz produtividade e pode deixar muita gente bem pobre, como também pode deixar muita gente bem rica. Tudo depende de assimetria e risco - Leia <em>Arriscando a Própria Pele</em>.</p>

<p>Mas entenda o seguinte: é humanamente impossível competir com um algoritmo que tem acesso a todos os dados do planeta. Tenho vários exemplos pessoais no ramo da engenharia química/mecânica/civil que com o certo <strong>--CONTEXTO--</strong> você argumenta até contra seu professor universitário com mais de 45 mil anos de experiência (e sai vitorioso), mas você pode pesquisar rapidamente batalhas de programadores contra IA em produção de código e vai entender o nível que já estamos. Lembrando que, em 2023, IA era meio fraquinha. Gosto de compartilhar também esse gráfico, que é a origem de toda discussão. If you know, you know.</p>

<figure>
    <img src="/images/blog/ia-grafico.png" alt="O Gráfico do Apocalipse — Vamos voltar ao campo ou instalar ar condicionado?" />
    <figcaption>O Gráfico do Apocalipse — Vamos voltar ao campo ou instalar ar condicionado?</figcaption>
</figure>

<p>Porém, ainda é possível competir contra humanos. No final do dia, a última competição é a que importa. Homens compram de homens, não de máquinas. As relações HUMANAS definem e definirão a economia para sempre (ou até Skynet ser de facto algo). Só que, cabe a reflexão, a maioria das roupas que você usa são produzidas por infinitas máquinas de tear chinesas, ou são produzidas a mão por um camponês inglês que cobra bem mais caro?</p>
`,
    },
    {
        slug: 'industria-nao-tem-problema-de-dados',
        category: 'Dados & Engenharia',
        date: '06/07/2026',
        title: 'Indústria Não Tem Problema de Dados',
        summary: 'Toda indústria vive afogada em dados operacionais, mas ter dado não é o mesmo que ter informação. Uso um chiller industrial e 3.600 linhas de sensores para mostrar por que "Data Rich, Information Poor" é o verdadeiro problema — e como resgatar o método científico resolve isso.',
        content: `
<p>Se você já trabalhou em uma grande indústria ou oferecendo serviços técnicos para uma, com certeza você se deparou com dados. Imensidão de dados, operacionais, financeiros, dados pessoais. Vou focar apenas no primeiro tipo que é o que eu entendo melhor. Claro que o que será abordado pode ser extrapolado para praticamente todo tipo de informação armazenada em bancos de dados.</p>

<p>Pra começar, o que é um dado? A definição do dicionário nos diz:</p>
<ul>
    <li>[Informática] Informação que pode ser processada por um computador, programa de computador ou qualquer outro mecanismo eletrônico desenvolvido com esse propósito.</li>
    <li>[Filosofia] Ponto que começa uma premissa que, acessando direta ou indiretamente a consciência, pode servir como fundamento ou pressuposto em um processo cognitivo.</li>
    <li>Aquilo que está disponível para estudo ou análise, após ter sido alvo de investigação e pesquisa: pesquisa que se pautou em dados anteriores.</li>
    <li>[Matemática] Elemento ou quantidade conhecida que serve de base à solução de um problema.</li>
</ul>

<p>Para engenheiros, a primeira e a última definição são as mais agradáveis. Afinal, o que um engenheiro moderno busca é uma informação (geralmente armazenada em um computador) que contém um elemento que pode ser a base da solução de um problema. Isso não deixa de ser verdade, além de ser bem pragmático. Temos alguns problemas com relação à isso. Vou resumi-los na seguinte linha de raciocínio.</p>

<p>Vou guiar o pensamento usando uma indústria que usa um chiller industrial (para quem nunca viu, pense em um ar condicionado gigante) em um dos seus processos principais. Se aquele equipamento é uma das maiores fontes de consumo de capital (dinheiros) de um negócio, eu te garanto que as pessoas que prezam pela prosperidade da empresa têm o interesse em monitorar a operação do resfriador. Para isso, diversos instrumentos são instalados, várias temperaturas, vazões, correntes são medidas. Vários dados são gerados.</p>

<p>Perceba que se um dado for a base da solução de um problema, qualquer um que esteja olhando para tela de um supervisório (aka programa na tela do computador que mostra os dados), vai conseguir deduzir uma solução para um problema que está acontecendo no momento em que a operação está no limiar da inoperância, seja por gerar prejuízo ou por explosão da máquina. Não é assim que a banda toca, nem que o operador seja substituído pelo super modelo de IA da Anthropic, existe uma chance da situação ser complexa ao ponto em que teremos que apelar para a definição filosófica.</p>

<p>O motivo da segunda definição me atrair mais do que as demais é que: primeiro, ela não exclui as demais, ela cria um processo onde a informação não é tratada como algo milagroso que vai resolver seus problemas. é necessário ter uma premissa que ativa sua consciência e que irá servir como base para alguma conclusão. Ou seja, é necessário uma hipótese, raciocínio, utilização do dado para confirmar ou não a tese inicial. O dado passa quase por um método científico de Galileo.</p>

<p>O ponto é: indústrias (na verdade qualquer empresa) gera dados, nesse caso, os dados operacionais são os mais interessantes, pois impactam diretamente nos custos. O problema é que é necessária uma análise que não é tão trivial, principalmente se envolver mecanismos físicos (transferência de calor para um chiller). Isso é chamado de DRIP - "Data Rich, Information Poor" - ou, para os leigos, muita informação e pobreza intelectual.</p>

<p>Eu entendo que o problema de DRIP é composto por alguns pilares, mas o principal deles é o desafio de todo Big Data, os 5 V's - Velocidade, Volume, Variedade, Veracidade, Valor. No fim do dia a grande maioria das informações se perdem pelo pacing de mudança, pela quantidade de informação, pela diversidade sem organização e pela desconfiança que aqueles dados geram. Vamos voltar para o caso do Chiller.</p>

<p>O motivo daquele equipamento existir é trocar calor, se coletamos dados, deveria ser fácil saber quanto de CALOR foi removido do meio em determinado tempo. Para uma pessoa que estudou isso, uma simples pesquisa, ou sequer um prompt deveria ser o suficiente para conseguir essa informação. Teríamos um dado nos dando uma resposta. Mas, se a informação que temos é de algum tempo atrás, a operação pode ter mudado. Se a quantidade for tão grande que não conseguimos extrair os parâmetros que queremos? A quantidade de ruído pode ser tão relevante que impede uma análise sem um tratamento prévio.</p>

<p>No final do dia, caímos em um problema tão simples e até meio besta, mas na Era da Informação, é relativamente fácil ter acesso aos "dados", o difícil é fazer com que eles não baguncem a sua mente. No próximo texto, vou exemplificar como podemos usar a razão humana para suprir a falta de sensores não críticos.</p>

<figure>
    <img src="/images/blog/dados-pessoa-confusa.png" alt="Pessoa confusa em frente a um monitor cheio de gráficos e percentuais" />
    <figcaption>Muito dado, pouca informação — o retrato clássico do DRIP</figcaption>
</figure>

<p>A partir daqui, vou mostrar um exemplo do que estou dizendo, talvez fique muito engenharia de processos e blá blá blá. Ele tá bem simplificado, dados industriais são muito piores, mas serve como um fundamento e um exercício simplificado. Se precisar de ajuda para entender, joga o texto numa IA. O arquivo e o resultado esperado tá no final, usa IA, não faz na mão não!</p>

<p>Para provar o ponto, vou propor um teste prático. Imagine que você tem em mãos um arquivo simples, um banco de dados com 3.600 linhas registrando exatamente uma hora de operação daquele nosso chiller industrial, com medições coletadas segundo a segundo. Temos ali as variáveis clássicas: temperatura de entrada e saída da água gelada, vazão da linha, corrente elétrica do compressor e pressão do evaporador. Se eu te entregar essa tabela agora e perguntar: "Esse resfriador está operando bem ou está jogando dinheiro da empresa no lixo?", como você responderia?</p>

<p>Se a sua primeira reação for abrir esse arquivo e tentar caçar algum padrão rolando a tela, você vai bater de frente com a realidade crua do chão de fábrica. A temperatura de entrada fica dançando ali perto dos 12°C, subindo pra 12,2°C e caindo pra 11,8°C. A de saída gravita ao redor dos 7°C, enquanto a vazão vibra sem parar na faixa dos 150 metros cúbicos por hora. Se você pegar essas 3.600 linhas e jogar direto em um gráfico comum, vai dar de cara com uma parede de rabiscos tremidos. É o puro suco do ruído de instrumentação: pequenas interferências elétricas e flutuações normais de medição. Para quem olha o supervisório sem filtro, o equipamento parece estar trabalhando tranquilamente dentro dos conformes. Mas lembra da nossa segunda definição de dado? Aquela mais filosófica? Olhar para os números crus sem uma premissa só gera confusão mental e alimenta o problema do DRIP.</p>

<p>É aqui que a gente precisa resgatar o espírito de Galileo e aplicar um método científico em cima desse amontoado de informação. Antes de perguntar qualquer coisa pro banco de dados, precisamos formular a nossa hipótese usando a física básica da coisa. A razão de ser de um chiller é remover calor da água. Se o trocador de calor estiver sofrendo com alguma ineficiência ou incrustação, a troca térmica despenca. Para manter a água saindo nos mesmos 7°C programados, o compressor vai ter que fazer mais força, puxando mais corrente elétrica da rede. Ou seja, o nosso raciocínio não é olhar se a temperatura isolada está "bonita", mas sim investigar a relação direta entre a energia térmica que realmente está sendo tirada do sistema e a energia elétrica que o compressor está gastando para dar conta do recado.</p>

<figure>
    <img src="/images/blog/dados-metodo-cientifico.png" alt="Fluxo do método científico: observação, hipótese, experimentação, análise e conclusão" />
    <figcaption>Observação → hipótese → experimentação → análise → conclusão — o funil que transforma dado bruto em informação</figcaption>
</figure>

<p>Para resolver o problema e enxergar a verdade por trás daquele ruído todo, a análise precisa passar por uma lapidação. Primeiro, a gente usa a termodinâmica para cruzar a diferença de temperatura com a vazão, calculando o calor real removido a cada segundo. Depois, aplicamos um tratamento matemático simples para acalmar a ansiedade dos sensores, como uma média móvel, que suaviza as vibrações mecânicas da tubulação e os picos elétricos irrelevantes. Quando você limpa essa sujeira visual, o cenário muda de figura.</p>

<p>Em vez de olhar para milhares de pontos caóticos bagunçando a sua mente, você consegue gerar uma visualização onde as coisas finalmente fazem sentido. Imagine plotar uma comparação limpa entre a carga térmica estabilizada e o consumo elétrico do compressor ao longo daquela hora. Se a quantidade de calor removida permanece horizontal e constante, mas a linha da corrente do compressor apresenta um descolamento ou um comportamento anômalo para entregar exatamente o mesmo resultado, você acabou de comprovar ou refutar a sua tese inicial. O dado deixou de ser só um número piscando no computador e cumpriu seu papel de ativar a nossa consciência para resolver um problema real de engenharia.</p>

<p>Tirei essa ideia desse artigo ai que tava lendo pra passar o tempo: ANGELO, Corallo; CRESPINO, Anna Maria; DEL VECCHIO, Vito; LAZOI, Mariangela; MARRA, Manuela. Understanding and Defining Dark Data for the Manufacturing Industry. IEEE Transactions on Engineering Management, 2021.</p>

<div class="blog-attachments">
    <h3>Anexos</h3>
    <ul>
        <li><a href="/docs/dados_operacionais_chiller.csv" download>dados_operacionais_chiller.csv</a> — as 3.600 linhas cruas usadas no exemplo (uma hora de operação, segundo a segundo).</li>
        <li><a href="/images/blog/dados-chiller-analise.png" download>dados-chiller-analise.png</a> — o dado bruto, o dado tratado e o veredito (COP) lado a lado.</li>
    </ul>
</div>
`,
    },
];

export default posts;
