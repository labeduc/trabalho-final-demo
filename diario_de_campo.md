# Diário de Campo — uso de IA no Trabalho Final

> Este é o diário do **trabalho-modelo**. O modelo foi produzido com um assistente de IA de programação (Claude Code), e os episódios abaixo aconteceram de fato durante a produção. Eles servem de exemplo do nível de detalhe esperado.

## 1. Os três melhores prompts

### Prompt 1 — Exploração com função reutilizável (Etapa 1)

> **Contexto:** tenho sete arquivos JSONL de um dataset hoteleiro sintético e um README com o número de linhas esperado de cada um.
> **Objetivo:** uma função `inspecionar(df, nome, linhas_esperadas)` que eu possa chamar para as sete tabelas.
> **Detalhes:** ela deve comparar o número de linhas com o README, classificar cada coluna como numérica, texto, data, booleana ou lista, e contar nulos **e textos vazios separadamente** (o pandas não conta `""` como ausente).
> **Formato:** função Python com docstring que devolve um DataFrame coluna a coluna e imprime um resumo de 3 linhas.

**Por que funcionou:** o detalhe "textos vazios separadamente" veio de uma leitura prévia dos dados. Sem ele, a função diria que `demand_event` e `response_text` não têm ausentes, quando na verdade 94% e 31% das linhas estão vazias. Um prompt específico produz uma checagem específica.

### Prompt 2 — Pedir a interpretação, não só o número (Etapa 2)

> **Contexto:** a correlação de Pearson entre a nota média semanal e o RevPAR dá 0,22 quando junto todas as semanas de todos os hotéis.
> **Objetivo:** descobrir se essa relação pode ser causal ou se é espúria.
> **Detalhes:** calcule a correlação também **dentro de cada hotel** e **entre as médias dos 14 hotéis**, e explique a diferença entre os três números. Não conclua causalidade.
> **Formato:** uma tabela com os três níveis e um parágrafo de interpretação.

**Por que funcionou:** em vez de pedir "a correlação", pedi para separar os **níveis de análise**. O resultado (0,22 no geral, ≈ 0 dentro de cada hotel, 0,88 entre hotéis) mostra a confusão pelo *tier* de forma direta, e virou o gráfico interativo 9 e um parágrafo do relatório.

### Prompt 3 — Requisito do painel no modelo do Módulo 1 (Etapa 5)

O prompt completo está em `docs/planejamento_painel.md`, seção 4. Os pontos que fizeram diferença:

- dei as **fórmulas exatas** (razão de somas), em vez de "calcule a ocupação";
- disse o **que não fazer**: "nada de bibliotecas além do Chart.js" e "crie os gráficos uma vez e só atualize os dados";
- pedi **funções pequenas e nomeadas**, o que facilitou revisar e explicar cada parte.

**Por que funcionou:** o código veio no formato que eu conseguia revisar função por função, e os KPIs bateram com os notebooks na primeira conferência.

## 2. Um erro da IA

**O que pedi:** no bônus NoSQL (notebook 03), contar as avaliações de 5 estrelas **sem resposta do hotel** na coleção do *mongita*.

**O que veio errado:** a IA escreveu a consulta no padrão do MongoDB:

```python
colecao.count_documents({"rating": 5, "response": {"$exists": False}})
```

**Como percebi:** ao executar o notebook, a célula falhou com
`MongitaError: Mongita does not support '$exists'. These filter operators are supported: ('$in', '$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$nin')`.
O *mongita* imita a API do MongoDB, mas implementa só parte dela. A IA "sabia" MongoDB e assumiu que o *mongita* era igual.

**Como corrigi:** filtrei pelo operador suportado e testei a ausência do campo em Python, deixando um comentário que explica a limitação:

```python
# O mongita não implementa o operador $exists do MongoDB
sem_resposta_5 = sum(1 for doc in colecao.find({"rating": 5}) if "response" not in doc)
```

**Outro erro, mais perigoso porque não gerou mensagem de erro:** os **textos de interpretação** que a IA escreveu antes de ver as saídas tinham números errados. Ela escreveu "nove hotéis dentro da faixa MARS" (eram oito), "quatro cenários geram ~95% das notas 1–2" (eram 82%) e "dois boutiques acima de 30% de notas ruins" (eram um boutique e um upscale). Percebi comparando cada frase com a saída da célula logo acima, e corrigi todas. **Lição:** código errado quebra e avisa. Texto errado passa despercebido se ninguém conferir.

## 3. Um aprendizado graças a uma explicação da IA

**A armadilha do calendário na projeção (Etapa 2).** Calculei o crescimento da receita do Marisol Bay Resort como `receita 2028 ÷ receita 2027 − 1` e obtive +1,0%. Ao pedir para a IA revisar o método, ela apontou que **os dois anos não têm o mesmo número de noites**: os dados começam em 4 de janeiro de 2027 (362 noites), e 2028 é bissexto (366 noites). Recalculando por **receita média por noite**, o crescimento real foi −0,1%. O "crescimento" era quase todo efeito de calendário.

**Onde apliquei:**

- na projeção para 2029, que passou a usar receita por noite × número de dias de cada mês de 2029;
- no painel, onde todos os indicadores são **razões** (por quarto disponível, por quarto vendido) e não totais, justamente para que períodos de tamanhos diferentes possam ser comparados;
- como regra geral: **antes de comparar dois totais, conferir se os períodos têm o mesmo tamanho**.
