# Viva360 Refactor B-E Status (Zero-Loss)

Generated at: 2026-02-16T11:56:00Z

| Fase | O que era para fazer | Status | Evidência | Falta |
|---|---|---|---|---|
| B1 | Segregar Mock Mode e impedir vazamento em produção | DONE | `lib/supabase.ts` (prod build lock), `backend/src/lib/runtimeGuard.ts`, `scripts/audit_test_route_leaks.ts` + `npm run qa:audit-route-leaks` PASS | Nenhum bloqueador |
| B2 | Restringir Admin em dados sensíveis (LGPD) | DONE | `backend/src/controllers/records.controller.ts` (admin 403), `backend/src/tests/records.controller.test.ts` PASS | Nenhum bloqueador |
| B3 | Hardening OAuth redirect/callback | DONE | `lib/oauthRedirectPolicy.ts`, `lib/supabase.ts`, `lib/oauthRedirectPolicy.test.ts` PASS | Nenhum bloqueador |
| B4 | Refatorar `services/api.ts` monolítico | DONE | `services/api/domains/*` + composição em `services/api.ts` | Nenhum bloqueador |
| B5 | Estruturar domínios e contratos de fluxo | DONE | `services/api/domains/*`, `src/flow/registry.ts`, `scripts/validate_flow_registry.ts` PASS | Nenhum bloqueador |
| B6 | Contratos e invariantes de integração | DONE | `npm run test:contracts` PASS, `scripts/regression_checklist.ts` gate ativo | Nenhum bloqueador |
| B7 | Consolidar duplicações críticas da API layer | DONE | API centralizada via `createApiDomains(...)`, `services/api/requestClient.ts` | Nenhum bloqueador |
| C1 | Auditar botões sem handler | DONE | `npx tsx scripts/audit_buttons.ts --strict` PASS | Nenhum bloqueador |
| C2 | Auditar rotas/navegação | DONE | `node scripts/audit_routes.cjs` + deep links E2E PASS | Nenhum bloqueador |
| C3 | Corrigir fluxos quebrados | DONE | Ajustes em `qa/flows/*` + `src/navigation/screenMap.tsx`; `test:qa:core` PASS | Nenhum bloqueador |
| C4 | Validar deep links por perfil | DONE | `qa/flows/deeplinks.spec.ts` PASS | Nenhum bloqueador |
| C5 | Ajustes UI/UX sem alterar regra de negócio | DONE | correções de estabilidade de navegação e smoke a11y (`qa/flows/accessibility-smoke.spec.ts`) | Nenhum bloqueador |
| D1 | Fortalecer base de unit/integration para regressão | DONE | `lib/oauthRedirectPolicy.test.ts`, `services/api/requestClient.test.ts`, contratos backend PASS | Nenhum bloqueador |
| D2 | Contract tests backend | DONE | `npm run test:contracts` PASS | Nenhum bloqueador |
| D3 | Expandir E2E crítico por trilha | DONE | consent/deeplink/a11y + `test:qa:core` (41 testes) PASS | Nenhum bloqueador |
| D4 | Matriz Tela×Botão×Fluxo automática | DONE | `scripts/generate_flow_matrix.ts` + `reports/screen_button_flow_matrix.*` | Nenhum bloqueador |
| D5 | Gates de CI para regressão contínua | DONE | `.github/workflows/ci.yml` atualizado com novos gates | Nenhum bloqueador |
| D6 | Checklist de regressão automático | DONE | `reports/regression_checklist.json` com `"ok": true` | Nenhum bloqueador |
| E1 | Polimento de performance (budget/checks) | DONE | `npm run perf:budget` PASS | Nenhum bloqueador |
| E2 | Cache/deduplicação de requests | DONE | `services/api/requestClient.ts` + testes PASS | Nenhum bloqueador |
| E3 | Hardening de links/imagens | DONE | `npm run test:audit` PASS (sem links/imagens quebrados) | Nenhum bloqueador |
| E4 | Acessibilidade smoke em fluxos principais | DONE | `qa/flows/accessibility-smoke.spec.ts` PASS | Nenhum bloqueador |
| E5 | Documentação final de execução | DONE | este arquivo + reports de matriz/flow/checklist | Nenhum bloqueador |

## Gate final

- `npm run qa:regression-checklist` => PASS
- `reports/regression_checklist.json` => `ok: true`

