# Trabalho Final — modelo de resolução

**Inteligência de Receita para os Hotéis de Port Alder**: uma implementação completa das seis etapas do [enunciado](../docs/enunciado-trabalho-final.md), feita como **referência** para professores e alunos do curso de Ciência de Dados.

> O dataset *Nice Rooms* é **sintético**. As conclusões valem para a cidade fictícia de Port Alder, não para o mercado hoteleiro real.

## Estrutura

```
modelo/
├── README.md                       ← este arquivo
├── requirements.txt                ← bibliotecas Python
├── dados/README.md                 ← onde estão os arquivos originais
├── notebooks/
│   ├── nice_rooms.py               ← funções e paleta compartilhadas
│   ├── 01_exploracao.ipynb         ← Etapa 1
│   ├── 02_estatistica.ipynb        ← Etapa 2 (com conclusão de 1 página)
│   ├── 03_banco_de_dados.ipynb     ← Etapa 3 (+ bônus NoSQL com mongita)
│   ├── 04_visualizacao.ipynb       ← Etapa 4 (9 visualizações)
│   └── figuras/                    ← PNG/HTML gerados pelo notebook 04
├── banco/
│   ├── nice_rooms.db               ← banco SQLite (gerado pelo notebook 03)
│   ├── diagrama_er.mmd             ← diagrama ER em Mermaid (fonte)
│   └── diagrama_er.png / .pdf      ← diagrama ER exportado
├── scripts/
│   └── gerar_dados_dashboard.py    ← gera dashboard/dados.js a partir do banco
├── dashboard/                      ← Etapa 5
│   ├── index.html                  ← estrutura
│   ├── style.css                   ← estilo
│   ├── script.js                   ← comportamento (Chart.js)
│   └── dados.js                    ← dados resumidos (hotel × mês)
├── docs/
│   └── planejamento_painel.md      ← público, decisões, wireframe, agregação, testes
├── diario_de_campo.md              ← Etapa 6
├── relatorio_executivo/
│   ├── relatorio_executivo.pdf     ← Etapa 6 (2 páginas)
│   └── relatorio_executivo.html    ← fonte do PDF
└── apresentacao/
    ├── slides.pdf / slides.html    ← 3 slides
    ├── roteiro.md                  ← roteiro de 4 minutos
    └── painel.png                  ← captura usada no slide 1
```

## Como abrir cada parte

**Online:** cada push na `main` publica o repositório no GitHub Pages (workflow `.github/workflows/pages.yml`), em <https://labeduc.github.io/trabalho-final-demo/>.

**Painel:** abra `dashboard/index.html` no navegador, com duplo clique. Não precisa instalar nada nem subir servidor; só é necessária a internet, para carregar o Chart.js da CDN.

**Notebooks:** já estão **executados**, com as saídas visíveis. Para reexecutar:

```bash
cd modelo
uv venv --python 3.12 .venv              # ou: python -m venv .venv
uv pip install -r requirements.txt       # ou: .venv/bin/pip install -r requirements.txt
cd notebooks
../.venv/bin/jupyter lab                 # e rode 01 → 02 → 03 → 04, nesta ordem
```

A ordem importa: o **03 cria o banco** `banco/nice_rooms.db` que o **04** e o script do painel leem.

**Dados do painel:** depois de rodar o notebook 03, gere novamente o arquivo do painel:

```bash
.venv/bin/python scripts/gerar_dados_dashboard.py
```

O script imprime os valores de conferência (receita total, ocupação, nota média...), que devem bater com os KPIs do painel com todos os filtros em "todos".

## Principais resultados

| Pergunta da diretoria | Resposta curta |
|---|---|
| Desempenho vs. concorrentes | 6 hotéis acima e 8 abaixo da paridade (RGI). Os de baixo cobram menos que os pares e mesmo assim não vendem mais quartos. O gap equivale a ~9,4 mi USD de receita de quartos em 2 anos. |
| Decisões de preço funcionam? | Não há evidência num sentido nem no outro: a semana seguinte é "melhor" em ~38–43% dos casos para as três ações. O resultado é observacional e as recomendações se repetem sem mudar o posicionamento. |
| Hóspedes e financeiro | 55,8% das avaliações têm ≤ 3 estrelas, e 4 causas operacionais geram 82% das notas 1–2. A correlação nota × RevPAR (0,22) é espúria: some dentro de cada hotel. |

## Ferramentas

- **Python 3.12** · pandas · matplotlib · plotly · wordcloud · sqlite3 · mongita
- **SQLite** (banco relacional) e **mongita** (banco de documentos, bônus)
- **HTML + CSS + JavaScript** com **Chart.js 4.4.1** (via CDN jsDelivr)
- **Mermaid** para o diagrama ER, e Google Chrome (modo *headless*) para exportar diagrama, relatório e slides para PNG/PDF
- **Assistente de IA:** Claude Code. Veja o `diario_de_campo.md`.

## Decisões que vale conhecer

- **Indicadores ponderados:** ocupação, ADR, RevPAR e RGI são calculados como **razão de somas** (cada hotel pesa pelo número de quartos). Por isso a ocupação geral é 70,7%, e não os 70,9% (média simples das noites) do README do dataset.
- **Comparações de preço só dentro do tier**, usando os índices contra o *comp set* (ARI, MPI, RGI) e a diária MARS.
- **Nenhuma linha foi removida:** todos os valores ausentes são explicados pelo README do dataset e foram mantidos como nulos (notebook 01, seção 5).
- **Normalização:** o banco remove cópias de atributos do hotel e resumos que mudam com o tempo, e mantém os indicadores publicados. A justificativa está no notebook 03, seção 2.
