# Roteiro da apresentação (4 minutos)

Slides: `slides.html` (abrir no navegador) ou `slides.pdf`. Demonstração: `../dashboard/index.html`.

| Tempo | Slide / ação | O que falar |
|---|---|---|
| 0:00–0:40 | **Slide 1** — o painel e para quem | "O painel é para a diretoria da associação, que precisa decidir onde agir primeiro nos 14 hotéis. Ele responde às três perguntas da diretoria: desempenho contra os concorrentes, decisões de preço e voz dos hóspedes." |
| 0:40–2:00 | **Demonstração ao vivo** | 1) Abrir o painel com todos os filtros: 6 KPIs, RGI de 101,5. 2) Mostrar a tabela ordenada pelo RGI, com o Foxglove no topo e ⚠. 3) Filtrar **Hotel = The Foxglove**: RGI 76, a linha azul sempre abaixo da cinza (concorrentes), e as decisões são quase só "aumentar". 4) Filtrar **Tier = luxury + Hotel = Northgate Inn** para mostrar a mensagem de "nenhum dado". 5) Limpar os filtros. |
| 2:00–3:00 | **Slide 2** — principal descoberta | "8 dos 14 hotéis perdem receita para os concorrentes, e o padrão é o mesmo: cobram abaixo da diária de mercado e nem assim vendem mais quartos. O Foxglove recebeu recomendação de aumentar o preço em 100 semanas e continua 19% abaixo. Isso é associação, não causa, e os dados são sintéticos, mas indica onde a diretoria deve olhar primeiro." |
| 3:00–3:50 | **Slide 3** — destaque do Diário de Campo | "O erro mais perigoso da IA não foi o código que quebrou, foi o texto que parecia certo. Por isso conferi cada número contra a saída do notebook e os KPIs do painel contra os notebooks." |
| 3:50–4:00 | Encerramento | "Os detalhes estão no relatório executivo e nos notebooks. Obrigado." |

**Perguntas prováveis e respostas curtas**

- *Por que a ocupação do painel (70,7%) não é a do README (70,9%)?* O painel pondera pelo número de quartos (Σ vendidos ÷ Σ disponíveis). O README usa a média simples das noites.
- *As decisões de preço funcionam?* Não dá para saber com esses dados: o resultado é observacional e não há grupo de comparação.
- *Por que 100 é a linha dos quadrantes?* 100 é a paridade com os concorrentes do mesmo tier, por definição dos índices ARI e MPI.
