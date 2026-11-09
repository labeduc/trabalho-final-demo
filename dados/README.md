# Dados

Os arquivos originais do dataset **não são copiados** para esta pasta, para não duplicar ~23 MB no repositório. Eles estão na pasta `dados/` da raiz do repositório (`../../dados/` a partir de `modelo/notebooks/`).

Os notebooks procuram os arquivos JSONL primeiro em `modelo/dados/` e depois em `../dados/` (veja `PASTA_DADOS` em `notebooks/nice_rooms.py`). Para usar este modelo fora do repositório, copie os sete arquivos `.jsonl` para esta pasta ou baixe-os do Kaggle:

<https://www.kaggle.com/datasets/crissymoon/nice-rooms-hotel-revenue-rate-intelligence>

| Arquivo | Linhas |
|---|---:|
| `hotels.jsonl` | 14 |
| `room_types.jsonl` | 42 |
| `daily_market.jsonl` | 10.192 |
| `weekly_performance.jsonl` | 1.456 |
| `rate_decisions.jsonl` | 1.442 |
| `reviews.jsonl` | 12.077 |
| `review_scenarios.jsonl` | 11 |
