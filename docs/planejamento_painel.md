# Planejamento do painel (Etapa 5)

Escrito **antes** de construir a página, conforme os passos 1 a 3 da Etapa 5.

## 1. Público e decisões

**Público:** a **diretoria da associação de hoteleiros** de Port Alder, que acompanha os 14 hotéis ao mesmo tempo. O gerente de um hotel também consegue usar o painel: basta filtrar pelo hotel dele.

**Três decisões que o painel deve apoiar:**

1. **Em quais hotéis intervir primeiro?** Os que perdem receita para os concorrentes diretos (RGI < 100) e se o problema é de preço ou de ocupação (mapa de posicionamento).
2. **A política de preços semanal merece confiança?** O resultado da semana seguinte é parecido para aumentar, manter e reduzir. Se for, a diretoria não deve usar esse indicador para premiar ou cobrar gerentes.
3. **Onde investir em operação para melhorar as avaliações?** Os motivos que mais geram notas baixas (conservação, barulho, cobrança, limpeza) e quais hotéis concentram mais notas 1–2.

## 2. Wireframe

Desktop (≥ 1100 px). No celular, os blocos viram uma coluna, os KPIs ficam em 2 por linha e os filtros ocupam a largura toda.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ CABEÇALHO: título + público                                              │
│ [Ano ▾] [Tier ▾] [Hotel ▾] (Limpar)            ← filtros fixos no topo   │
├──────────────────────────────────────────────────────────────────────────┤
│ "Mostrando N hotéis · período"                                           │
│ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐             │
│ │Receita ││Ocupação││  ADR   ││ RevPAR ││  RGI   ││  Nota  │  ← 6 KPIs   │
│ └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘             │
│ 1. DESEMPENHO CONTRA OS CONCORRENTES                                     │
│ ┌───────────────────────────────┐┌───────────────────────────────┐       │
│ │ Linha: RevPAR mensal          ││ Dispersão: ARI × MPI          │       │
│ │ selecionados × comp set       ││ quadrantes em 100             │       │
│ └───────────────────────────────┘└───────────────────────────────┘       │
│ 2. DECISÕES DE PREÇO E VOZ DOS HÓSPEDES                                  │
│ ┌───────────────────────────────┐┌───────────────────────────────┐       │
│ │ Barras 100%: ação → resultado ││ Barras: motivos das avaliações│       │
│ └───────────────────────────────┘└───────────────────────────────┘       │
│ 3. HOTÉIS EM DETALHE                                                     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Tabela: hotel, tier, receita, ocupação, ADR, RevPAR, RGI ⚠, nota │     │
│ └──────────────────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────────────┤
│ RODAPÉ: fonte dos dados + aviso "dataset sintético"                      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Revisão com princípios de UX (Módulo 6):**

- **Hierarquia visual:** KPIs primeiro (respostas rápidas), depois os gráficos agrupados pelas três perguntas da diretoria, e por fim o detalhe (tabela).
- **Agrupamento:** cada seção tem um título numerado que corresponde a uma pergunta de negócio.
- **Celular:** filtros empilhados e com largura total; a tabela rola de lado dentro do próprio cartão, para que a página nunca role horizontalmente.
- **Cor com significado:** cada tier tem uma cor fixa (a mesma dos notebooks); azul = bom, cinza = neutro, vermelho = ruim. O RGI abaixo de 100 tem ⚠ e texto, não só cor.
- **Tabela ordenada pelo problema:** do menor para o maior RGI, para que os hotéis que precisam de atenção apareçam no topo.

## 3. Dados para a web

O navegador não lê os JSONL originais (~23 MB) nem o banco SQLite. O script `scripts/gerar_dados_dashboard.py` lê `banco/nice_rooms.db` e gera `dashboard/dados.js` (~100 KB).

| Decisão | Escolha | Justificativa |
|---|---|---|
| Nível de agregação | **hotel × mês** (336 linhas) | O mês preserva a sazonalidade (forte nos dados) e permite filtrar por ano, tier e hotel. Noite ou semana (10 mil linhas) seriam detalhe demais para a diretoria e deixariam o arquivo dezenas de vezes maior. |
| O que guardar | **somas** (quartos disponíveis/vendidos, receitas, receita equivalente dos concorrentes) | Assim a página recalcula ocupação, ADR, RevPAR e RGI para qualquer filtro pela razão de somas, sem tirar "média de médias". |
| Avaliações | contagem por nota (1–5) e respostas, por hotel × mês | Basta para nota média e % de 1–2 estrelas. O texto das avaliações não vai para a web. |
| Cenários e decisões | contagens por hotel × ano | Os gráficos só precisam de proporções. |
| Formato | `.js` com `const DADOS = {...}` | Funciona abrindo o arquivo direto do disco (`file://`), onde `fetch()` de um `.json` local é bloqueado pelo navegador. |

## 4. Requisitos para a IA (modelo Contexto, Objetivo, Detalhes, Formato)

O prompt principal usado para gerar a primeira versão do `script.js`:

> **Contexto:** sou analista de dados de uma associação de 14 hotéis. Tenho um arquivo `dados.js` que define `const DADOS` com `hoteis` (id, nome, tier, quartos) e `mensal` (h, a, m, disp, vend, rec_q, rec_x, cs_rec, cs_vend, cs_rec_q), além de `avaliacoes`, `cenariosQtd` e `decisoes`, todos com os campos `h` (hotel) e `a` (ano). A página usa Chart.js 4 via CDN.
> **Objetivo:** escrever `script.js` para um painel com 3 filtros (ano, tier, hotel) que atualizam juntos 6 KPIs, 4 gráficos e 1 tabela.
> **Detalhes:** os indicadores devem ser calculados como razão de somas (ocupação = Σvend/Σdisp; ADR = Σrec_q/Σvend; RevPAR = Σrec_q/Σdisp; RGI = RevPAR ÷ (Σcs_rec/Σdisp) × 100). Crie os gráficos uma vez e só atualize os dados. Quando o filtro não retornar linhas, esconda o conteúdo e mostre uma mensagem. Use `Intl.NumberFormat("pt-BR")`. Nada de bibliotecas além do Chart.js. Nomes de variáveis em português.
> **Formato:** um único arquivo JavaScript comentado, com funções pequenas (filtrar, indicadores, atualizarKPIs, atualizarGrafico…, atualizarTabela, atualizarPainel).

## 5. Testes realizados

- **Console do navegador:** nenhuma mensagem de erro ao abrir a página e ao trocar os filtros.
- **Estado vazio:** `Tier = luxury` + `Hotel = Northgate Inn` → a mensagem aparece e o botão "Limpar filtros" restaura tudo.
- **Responsividade:** testado a 1400 px (6 KPIs por linha, gráficos em 2 colunas) e a 390 px (2 KPIs por linha, 1 coluna, sem rolagem horizontal da página).
- **KPIs × notebooks** (filtro "todos"):

| KPI do painel | Valor no painel | Valor no notebook | Onde |
|---|---|---|---|
| Receita total 2027–2028 | US$ 236,0 mi | 236.002.362 USD (soma do ranking 5.1) | `03_banco_de_dados`, `scripts/gerar_dados_dashboard.py` |
| Nota média | 3,31 ★ | 3,31 | `02_estatistica`, seção 1.3 |
| % de avaliações com 1–2 ★ | 29,2% | 29,2% (9,0% + 20,2%) | `02_estatistica`, seção 1.3 |
| Receita do The Foxglove em 2028 | US$ 2,6 mi | 2,56 mi | `03_banco_de_dados`, seção 5.1 |
| RGI do The Foxglove (2 anos) | 76,0 | 76,0 | `04_visualizacao`, gráfico 3 |

A ocupação do painel (70,7%) é a **ocupação ponderada** (Σ vendidos ÷ Σ disponíveis). O README do dataset informa 70,9%, que é a **média simples** das 10.192 noites, na qual um hotel de 38 quartos pesa o mesmo que um de 240. A diferença é de definição, não de erro. O mesmo vale para ADR e RevPAR.
