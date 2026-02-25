# Missing Screens Classification

- Snapshot auditado: `fb436e66:AUDIT_RESULTS.json`
- Auditoria atual: `AUDIT_RESULTS.json`
- Gerado em: `2026-02-25T02:29:47.473516+00:00`

## Resumo

- `oldMissingScreensCount`: 106
- `currentMissingScreensCount`: 0
- `OK_INTERNO`: 106
- `DEAD_END`: 0
- `VIEW_FALTANDO`: 0

## Causa raiz

- Parser de screenMap no deep_audit.py usava split textual frágil; substituído por extração brace-aware.

## Conclusão

- Os 106 `missing_screens` do snapshot antigo foram reclassificados como `OK_INTERNO` (falso positivo de auditoria).
- A auditoria atual (`deep_audit.py` com parser brace-aware) reporta `missing_screens: 0`.
