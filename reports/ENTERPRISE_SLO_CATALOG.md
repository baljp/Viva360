# Catálogo de SLOs (endpoint/fluxo crítico)

Fonte estruturada: `reports/ENTERPRISE_SLO_CATALOG.json`

## Endpoints críticos
- `/api/auth/login` — p95 <= 1200ms, disponibilidade 99.5%
- `/api/oracle/draw` — p95 <= 1500ms, disponibilidade 99.0%
- `/api/chat/rooms/:id/messages` — p95 <= 900ms, disponibilidade 99.5%
- `/api/checkout/pay` — p95 <= 1800ms, disponibilidade 99.5%
- `/api/notifications` — p95 <= 1000ms, disponibilidade 99.0%
- `/api/finance/summary` — p95 <= 1000ms, disponibilidade 99.0%
- `/api/marketplace/products` — p95 <= 1000ms, disponibilidade 99.0%

## Fluxos críticos
- Google OAuth -> sessão hidratada
- ciclo de escambo (create->complete)
- ciclo de recrutamento (apply->interview->decision)
- ciclo LGPD de prontuário (grant->create/list->revoke->block)

## Medidas mínimas
- latência p95
- error rate
- disponibilidade
- burn-rate por janela (1h/6h/24h)
