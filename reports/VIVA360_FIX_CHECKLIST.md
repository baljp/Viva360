# Viva360 - Checklist de Correcao (Enterprise / Zero-Loss)

Gerado em: 2026-02-17

## P0 (bloqueadores de confiabilidade/operacao)
- [ ] Remover `backend/node_modules/**` do Git (migrar para instalacao em build + lockfile); validar `npm ci` e deploy Vercel.
- [ ] Garantir que nao existe service worker duplicado nem cache stale em prod; validar cold reload em Safari/Chrome apos deploy.
- [ ] Rodar `npm run qa:regression-checklist` local e em CI; manter PASS.

## P1 (hardening e previsibilidade)
- [ ] Mapear endpoints por tela com base em `services/` usados (nao so inferencia), e enriquecer `reports/screen_button_flow_matrix.json`.
- [ ] Revisar endpoints LGPD/sensiveis para garantir gate em todas as rotas (admin nunca ve prontuario).
- [ ] Padronizar logging backend (somente logger) e garantir redacao PII em paths de prontuario/chat/auth.
- [ ] Tornar E2E menos flakey (timeouts/polls consistentes) e adicionar retries somente em checks de "infra" quando inevitavel.

## P2 (performance/ux sem mudar identidade)
- [ ] Remover dependencia de `cdn.tailwindcss.com` em producao (CSS buildado/local); manter look & feel.
- [ ] Medir budget por rota (home/tribo/chat/checkout/agenda) e otimizar code-splitting por dominio.
- [ ] Garantir cancelamento (AbortController) nos fetches principais para evitar race/flicker em navegacao rapida.

## P3 (produto / "calm UX" e comunidade)
- [ ] Gamificacao implicita: reduzir ruido visual na home e mover detalhes para "Insights" sem apagar sistemas existentes.
- [ ] Tribo: flows completos e persistentes para salas/circulos e convites externos com vinculo automatico pos-login.

## Como verificar (gates)
- `npm run qa:regression-checklist`
- `npm run qa:matrix` (gera matriz)
- `npm run qa:audit-tracked-secrets`
- `npm run qa:audit-route-leaks`

