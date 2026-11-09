"""Gera dashboard/dados.js, o conjunto de dados resumido que o painel web consome.

Uso (a partir da pasta modelo/):
    .venv/bin/python scripts/gerar_dados_dashboard.py

Lê o banco banco/nice_rooms.db (criado pelo notebook 03) e agrega os dados por
HOTEL x MÊS. Por quê:
- tamanho: 14 hotéis x 24 meses = 336 linhas (~100 KB no total), contra 10.192 noites e
  12.077 avaliações nos arquivos originais (~23 MB). A página carrega na hora;
- utilidade: o mês preserva a sazonalidade (que é forte) e permite filtrar por
  ano, tier e hotel. A noite ou a semana seriam detalhe demais para a diretoria;
- correção: guardo SOMAS (quartos, receitas), não médias. Assim o JavaScript
  recalcula ocupação, ADR, RevPAR e RGI para qualquer combinação de filtros
  com a mesma fórmula do setor (razão de somas), sem tirar "média de médias".

O arquivo é .js (e não .json) para que a página funcione aberta direto do disco
(file://), onde o navegador bloqueia fetch() de arquivos locais.
"""
import json
import sqlite3
from datetime import date
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
BANCO = RAIZ / "banco" / "nice_rooms.db"
SAIDA = RAIZ / "dashboard" / "dados.js"

conexao = sqlite3.connect(BANCO)


def sql(consulta: str) -> pd.DataFrame:
    return pd.read_sql(consulta, conexao)


hoteis = sql("SELECT hotel_id AS id, name AS nome, tier, rooms AS quartos FROM hotels ORDER BY hotel_id")

# Desempenho: somas por hotel e mês. Os campos cs_* permitem recalcular os índices
# contra os concorrentes (comp set) ponderando pelo tamanho do hotel.
mensal = sql("""
SELECT hotel_id AS h, year AS a, month AS m,
       SUM(rooms_available)                                AS disp,
       SUM(rooms_sold)                                     AS vend,
       ROUND(SUM(room_revenue), 2)                         AS rec_q,
       ROUND(SUM(ancillary_revenue), 2)                    AS rec_x,
       ROUND(SUM(comp_set_revpar * rooms_available), 2)    AS cs_rec,
       ROUND(SUM(comp_set_occupancy * rooms_available), 2) AS cs_vend,
       ROUND(SUM(comp_set_adr * comp_set_occupancy * rooms_available), 2) AS cs_rec_q
FROM daily_market
GROUP BY hotel_id, year, month
ORDER BY hotel_id, year, month
""")

# Avaliações por hotel e mês da estadia: contagem por nota (1 a 5) e respostas
avaliacoes = sql("""
SELECT hotel_id AS h, CAST(strftime('%Y', stay_date) AS INTEGER) AS a,
       CAST(strftime('%m', stay_date) AS INTEGER) AS m,
       SUM(rating = 1) AS n1, SUM(rating = 2) AS n2, SUM(rating = 3) AS n3,
       SUM(rating = 4) AS n4, SUM(rating = 5) AS n5,
       SUM(response_hours IS NOT NULL) AS resp,
       ROUND(SUM(COALESCE(response_hours, 0)), 1) AS horas
FROM reviews
GROUP BY h, a, m
""")

# Cenários por hotel e ano: quantidade e soma das notas (para a nota média)
cenarios_qtd = sql("""
SELECT hotel_id AS h, CAST(strftime('%Y', stay_date) AS INTEGER) AS a, scenario_id AS c,
       COUNT(*) AS n, SUM(rating) AS soma
FROM reviews GROUP BY h, a, c
""")
cenarios = sql("SELECT scenario_id AS id, label AS nome, expected_sentiment AS sentimento FROM review_scenarios")

# Decisões de preço por hotel e ano (pelo ano da semana da decisão): ação x resultado
decisoes = sql("""
SELECT hotel_id AS h, CAST(strftime('%Y', week_start) AS INTEGER) AS a, action AS acao, outcome AS res,
       COUNT(*) AS n
FROM rate_decisions GROUP BY h, a, acao, res
""")
conexao.close()


def registros(df: pd.DataFrame) -> list[dict]:
    """Converte o DataFrame em lista de dicionários com tipos nativos do Python."""
    return json.loads(df.to_json(orient="records"))


dados = {
    "geradoEm": date.today().isoformat(),
    "hoteis": registros(hoteis),
    "mensal": registros(mensal),
    "avaliacoes": registros(avaliacoes),
    "cenarios": registros(cenarios),
    "cenariosQtd": registros(cenarios_qtd),
    "decisoes": registros(decisoes),
}
conteudo = ("// Gerado por scripts/gerar_dados_dashboard.py a partir de banco/nice_rooms.db. Não edite à mão.\n"
            f"const DADOS = {json.dumps(dados, ensure_ascii=False, separators=(',', ':'))};\n")
SAIDA.write_text(conteudo, encoding="utf-8")
print(f"{SAIDA.relative_to(RAIZ)}: {SAIDA.stat().st_size / 1024:.0f} KB | "
      + ", ".join(f"{k}={len(v)}" for k, v in dados.items() if isinstance(v, list)))

# --- Valores de conferência: devem bater com os KPIs do painel (filtro "Todos") ---
receita = mensal["rec_q"].sum() + mensal["rec_x"].sum()
ocupacao = mensal["vend"].sum() / mensal["disp"].sum()
adr = mensal["rec_q"].sum() / mensal["vend"].sum()
revpar = mensal["rec_q"].sum() / mensal["disp"].sum()
rgi = revpar / (mensal["cs_rec"].sum() / mensal["disp"].sum()) * 100
notas = avaliacoes[["n1", "n2", "n3", "n4", "n5"]].sum()
nota_media = sum((i + 1) * n for i, n in enumerate(notas)) / notas.sum()
print("\nConferência (todos os hotéis, 2027-2028):")
print(f"  Receita total: {receita:,.0f} USD")
print(f"  Ocupação:      {ocupacao * 100:.1f}%")
print(f"  ADR:           {adr:.2f} USD")
print(f"  RevPAR:        {revpar:.2f} USD")
print(f"  RGI:           {rgi:.1f}")
print(f"  Nota média:    {nota_media:.2f} | 1-2 estrelas: {(notas['n1'] + notas['n2']) / notas.sum() * 100:.1f}%")
