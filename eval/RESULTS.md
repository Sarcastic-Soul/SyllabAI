# Retrieval eval results

- Run at: 2026-10-03T14:01:59.526Z
- Embedding model: gemini-embedding-001
- Documents: 4, all in one course per chunk size
- Questions: 72
- Chunks retrieved per question (k): 5

## All questions (72)

| Chunk size | Overlap | Chunks | Mode | recall@1 | recall@5 | MRR |
| ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 4000 | 200 | 12 | vector | 77.8% | 100.0% | 0.885 |
| 4000 | 200 | 12 | hybrid | 79.2% | 100.0% | 0.889 |
| 1000 | 150 | 57 | vector | 79.2% | 97.2% | 0.873 |
| 1000 | 150 | 57 | hybrid | 76.4% | 100.0% | 0.869 |

## Keyword questions (37)

| Chunk size | Overlap | Chunks | Mode | recall@1 | recall@5 | MRR |
| ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 4000 | 200 | 12 | vector | 86.5% | 100.0% | 0.932 |
| 4000 | 200 | 12 | hybrid | 86.5% | 100.0% | 0.932 |
| 1000 | 150 | 57 | vector | 86.5% | 100.0% | 0.932 |
| 1000 | 150 | 57 | hybrid | 83.8% | 100.0% | 0.914 |

## Paraphrased questions (35)

| Chunk size | Overlap | Chunks | Mode | recall@1 | recall@5 | MRR |
| ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 4000 | 200 | 12 | vector | 68.6% | 100.0% | 0.836 |
| 4000 | 200 | 12 | hybrid | 71.4% | 100.0% | 0.843 |
| 1000 | 150 | 57 | vector | 71.4% | 94.3% | 0.810 |
| 1000 | 150 | 57 | hybrid | 68.6% | 100.0% | 0.820 |

## How to read this

- A hit means a returned chunk is from the right document and contains the answer text from `eval/questions.json`.
- Bigger chunks hold more text, so they contain the answer more easily; with few chunks in total, recall@k is close to its ceiling. Compare recall@1 and MRR across modes at the same chunk size first.
- The corpus is small (four documents). The numbers show direction, not what to expect on large uploads.

## Misses

- chunk size 1000, vector: panama-canal-12, panama-canal-17
