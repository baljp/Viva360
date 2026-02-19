# TRIAGE REPORT — Viva360 Production (2026-02-18)

## Smoke Test Results: 15 ✅ | 0 ❌ | 1 ⚠️

---

## 1) Env & Deploy — ✅ SAUDÁVEL

| Check | Status | Detalhe |
|-------|--------|---------|
| Health endpoint | ✅ | 200, degraded: false |
| Deploy sync | ✅ | Vercel etag matches latest build |
| Mock flags | ✅ | Nenhum MOCK_ENABLED/APP_MODE=MOCK em prod |
| CORS | ✅ | allow-origin: viva360.vercel.app |
| NODE_ENV | ✅ | production |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Apenas no backend (env.production.local) |

## 2) Auth & RLS — ✅ FUNCIONAL

| Check | Status | Detalhe |
|-------|--------|---------|
| Precheck-login | ✅ | Retorna allowed/role/nextAction corretamente |
| Login proteção | ✅ | Rejeita emails sem registro com código claro |
| Test emails | ✅ | Bloqueados em prod: "TEST_EMAIL_RESERVED" |
| Endpoints sem auth | ✅ | Todos retornam 401: Missing Authorization header |
| JWT secret | ✅ | Configurado via env var em prod |

## 3) SPA Routing — ✅ FUNCIONAL

| Check | Status | Detalhe |
|-------|--------|---------|
| /login | ✅ | 200 |
| /pro/dashboard | ✅ | 200 |
| /client/garden | ✅ | 200 |
| /space/dashboard | ✅ | 200 |
| vercel.json fallback | ✅ | `/(.*) → /index.html` presente |
| API routing | ✅ | `/api/*` mapeado para serverless functions |

## 4) Service Worker — ⚠️ ATENÇÃO

SW ativo com Workbox precache. Após cada deploy, usuários com SW antigo
podem ver versão stale até o SW se atualizar (`skipWaiting` ativo, mas
depende do browser aceitar). **Recomendação**: testar em aba anônima após deploys.

## 5) Controllers — Análise de Persistência

### ✅ Usam Prisma (persistem no DB)
- auth.controller.ts
- users.controller.ts
- calendar.controller.ts
- rooms.controller.ts
- marketplace.controller.ts
- checkout.controller.ts
- reviews.controller.ts
- journal.controller.ts
- clinical.controller.ts
- invites.controller.ts
- metamorphosis.controller.ts
- appointments.controller.ts
- space.controller.ts
- admin.controller.ts
- executive.controller.ts
- oracle.controller.ts
- profile.controller.ts
- notifications.controller.ts
- chat.controller.ts (via service → Prisma)
- tribe.controller.ts (via service → repository → Prisma)
- finance.controller.ts (via service → repository → Prisma)

### ⚠️ In-memory Map (guarded by isMockMode — OK em prod)
- alchemy.controller.ts → `mockOffers` Map (prod usa Prisma)
- recruitment.controller.ts → `mockApplications`/`mockInterviews` (prod usa Prisma)
- records.controller.ts → `mockConsentStore` (prod usa Prisma)

### ❌ In-memory sem DB — dados perdidos em cold start
- **rituals.controller.ts** → `ROUTINES_BY_USER` Map
  - Sem tabela Routine no Prisma schema
  - Toda rotina salva é perdida quando Vercel faz cold start
  - Já marcado com `_ephemeral: true` e logger.warn
  - **TODO**: Criar tabela `Routine` ou campo JSONB em Profile

## 6) Bugs Corrigidos Neste Triage

| Bug | Arquivo | Fix |
|-----|---------|-----|
| Recovery email com `localhost:3000` hardcoded | recover.controller.ts | Usa `VITE_SUPABASE_AUTH_REDIRECT_URL` / `FRONTEND_URL` env var |

## 7) Artefatos Criados

| Arquivo | Propósito |
|---------|-----------|
| `scripts/prod-smoke.sh` | Smoke test automatizado contra produção |
| `TRIAGE-REPORT.md` | Este relatório |

## 8) Recomendações Pendentes

1. **Criar tabela `Routine`** no Prisma schema para persistir rituais
2. **Sentry/error tracking** no frontend para capturar exceptions em prod
3. **Playwright E2E contra prod** validando persistência (recarregar + verificar dado)
4. **Verificar Supabase Auth config**: Email provider enabled, redirect URLs incluem `https://viva360.vercel.app/*`
5. **SW cache**: Documentar que testes pós-deploy devem usar aba anônima
