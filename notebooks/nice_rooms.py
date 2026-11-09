"""Funções e constantes compartilhadas pelos notebooks do trabalho final.

Mantidas em um só lugar para que todos os notebooks leiam os dados
do mesmo jeito e usem a mesma paleta de cores.
"""
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

# Pasta dos arquivos JSONL. Procura primeiro em modelo/dados e depois na raiz do repositório.
_CANDIDATAS = [Path("../dados"), Path("../../dados")]
PASTA_DADOS = next(p for p in _CANDIDATAS if (p / "hotels.jsonl").exists())

PASTA_BANCO = Path("../banco")
ARQUIVO_BANCO = PASTA_BANCO / "nice_rooms.db"
PASTA_FIGURAS = Path("figuras")

# Colunas de data de cada tabela (o pandas só reconhece sozinho algumas delas).
COLUNAS_DATA = {
    "daily_market": ["date"],
    "weekly_performance": ["week_start"],
    "rate_decisions": ["week_start"],
    "reviews": ["review_date", "stay_date", "week_start"],
}

# Ordem fixa dos tiers (do mais caro ao mais barato) e uma cor fixa para cada um.
# A cor acompanha o tier em todos os gráficos, nos notebooks e no painel.
ORDEM_TIER = ["luxury", "upscale", "boutique", "midscale", "economy"]
CORES_TIER = {
    "luxury": "#2a78d6",
    "upscale": "#eb6834",
    "boutique": "#1baf7a",
    "midscale": "#eda100",
    "economy": "#e87ba4",
}

# Escala divergente para notas e resultados: azul = bom, cinza = neutro, vermelho = ruim.
COR_BOM = "#2a78d6"
COR_NEUTRO = "#b5b3ab"
COR_RUIM = "#e34948"
COR_TEXTO = "#52514e"


def carregar(nome: str) -> pd.DataFrame:
    """Lê um arquivo JSONL do dataset (uma linha = um registro) e converte as datas."""
    df = pd.read_json(PASTA_DADOS / f"{nome}.jsonl", lines=True, convert_dates=False)
    for coluna in COLUNAS_DATA.get(nome, []):
        df[coluna] = pd.to_datetime(df[coluna])
    return df


def estilo_graficos() -> None:
    """Aplica um estilo limpo (Aula 10): sem bordas superiores/direitas e grade discreta."""
    plt.rcParams.update({
        "figure.figsize": (10, 5),
        "figure.dpi": 110,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.edgecolor": "#c3c2b7",
        "axes.grid": True,
        "grid.color": "#e1e0d9",
        "grid.linewidth": 0.6,
        "axes.axisbelow": True,
        "axes.titlesize": 13,
        "axes.titleweight": "bold",
        "axes.titlelocation": "left",
        "axes.labelcolor": COR_TEXTO,
        "xtick.color": COR_TEXTO,
        "ytick.color": COR_TEXTO,
        "legend.frameon": False,
        "font.size": 10,
    })
