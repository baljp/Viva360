# Dashboards Operacionais (Erro/Latência por Domínio)

## 1. Overview Executivo
- SLO burn-rate (1h / 6h / 24h)
- Erro total por domínio: auth, oracle, tribe/chat, checkout, recruitment, records, finance, marketplace, notifications
- Latência p50/p95 por domínio
- Deploy marker (commit / horário)

## 2. Backend API (por endpoint)
- Requests, error rate, p50/p95/p99
- Breakdown por status code (2xx/4xx/5xx)
- Top erros por `code` (`DATA_SOURCE_UNAVAILABLE`, `INVALID_CREDENTIALS`, etc.)
- Cold starts (serverless) por rota crítica

## 3. Frontend Fluxos (telemetria funcional)
- `flow/action/status` por perfil
- `refreshData` success/error ratio por perfil
- Top estados de erro por tela de leitura
- Conversão por etapa (funis definidos em `FLOW_CONVERSION_OBSERVABILITY_SPEC.md`)

## 4. Degradação de leitura
- Incidência de fallback UI (`DegradedRetryNotice`) por domínio
- Retry attempts vs retry success
- Percentual de sessões com leitura parcial preservada

## 5. QA/Release Health
- Backend tests (71/71) trend
- QA crítico (6/6) trend
- Flow registry warnings (total + categorias)
- Feature contract gate (`unclassified`, `persistedValidated`, `mixedOrPartial`)
