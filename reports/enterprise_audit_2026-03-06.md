# Viva360 Enterprise Audit — 2026-03-06

## Executive Summary

O repositório já demonstra maturidade acima da média em contratos de fluxo, gates de CI, segregação de mock em produção, build formal e cobertura operacional básica. O principal avanço desta rodada foi zerar as telas com backend esperado sem evidência automatizada no inventário atual.

O ponto de atenção agora muda de “fluxos sem backend” para “prontidão enterprise real”. Os maiores riscos remanescentes não são cosméticos: isolamento multitenant em alguns endpoints, inconsistência de hardening entre funções serverless, duplicação de infraestrutura Redis/cache, observabilidade ainda parcial e hotspots de manutenção que vão encarecer cada novo ciclo de produto.

Veredito atual:
- Pode operar com boa confiabilidade funcional em ambiente real controlado.
- Ainda não está no patamar enterprise ideal para escala maior sem corrigir os itens críticos e altos abaixo.
- O foco agora deve migrar de “fechar fluxo” para “hardening de isolamento, custo e operação”.

## Scorecard (20 dimensões)

| Dimensão | Nota | Estado | Observação |
|---|---:|---|---|
| 1. Build reproducível | 8.5 | Bom | `build:backend`, `lint`, `typecheck` e CI formalizados |
| 2. Deploy safety | 7.0 | Médio | Build já compila backend, mas há inconsistência entre entrypoints serverless |
| 3. Hardening de produção | 8.0 | Bom | Runtime guard e bloqueio de mock em prod são bons |
| 4. Sessão/Auth | 8.0 | Bom | Cookie HttpOnly como caminho principal, mas ainda com fallback/legado no FE |
| 5. Multitenancy/API isolation | 5.5 | Fraco | Há endpoints globais ou sem checagem de participação/escopo |
| 6. Chat confidentiality | 5.0 | Fraco | Leitura de sala/configuração sem validação consistente de membership |
| 7. Input validation | 7.5 | Bom | Zod presente em vários pontos, mas ainda desigual |
| 8. Query safety | 6.0 | Médio | Uso de `queryRawUnsafe` ainda existe |
| 9. Prisma/data layer | 7.0 | Médio | Prisma consolidado, mas com consultas globais e bundling repetido |
| 10. Rate limiting | 6.5 | Médio | Estrutura existe, mas Redis distribuído segue opcional |
| 11. Cache strategy | 5.5 | Fraco | Duas stacks Redis/cache, uma com `KEYS` e config divergente |
| 12. Observabilidade frontend | 6.5 | Médio | Sentry existe, mas parte da telemetria ainda fica local/console |
| 13. Observabilidade backend | 7.5 | Bom | Métricas, health e request context existem |
| 14. Incident readiness | 7.0 | Médio | Health/readiness bons, mas nightly ainda usa mock com secrets reais |
| 15. CI/CD maturity | 8.5 | Bom | Gates numerosos e coverage por camada |
| 16. Test strategy | 8.0 | Bom | QA/E2E/contract fortes |
| 17. Performance frontend | 7.5 | Bom | Main chunk controlado; ainda há custo alto em monitoring/vendor |
| 18. Performance backend | 6.5 | Médio | Há consultas globais e endpoints pouco paginados |
| 19. Maintainability | 6.0 | Médio | God files e hotspots grandes ainda pesam |
| 20. Cost efficiency | 6.0 | Médio | Prisma em múltiplas functions + Redis duplicado + leituras amplas |

## O que já está bom

- O deploy formal agora compila backend e frontend no caminho de produção: `package.json`.
- O runtime guard de mock em produção está correto e explícito: `backend/src/lib/runtimeGuard.ts:5-38`.
- A API principal está com `helmet`, `compression`, `health` e métricas: `backend/src/app.ts:40-123`.
- A CSP está mais restritiva no frontend publicado: `vercel.json:169-181`.
- O CI cobre lint, typecheck, contratos, backend security, coverage por camada e smoke QA: `.github/workflows/ci.yml:20-240`.
- O inventário de backend real está atualizado e zerado em pendências: `reports/backend_real_inventory.json`.

## Achados Críticos

### C1. Chat permite leitura/configuração por `roomId` sem validar participação do usuário em todos os caminhos

Impacto: um usuário autenticado pode consultar metadados ou histórico de uma sala que não participa, se obtiver um `roomId` válido.

Evidência:
- `backend/src/controllers/chat.controller.ts:82-87` chama `getChatHistory(roomId)` sem checar membership do usuário.
- `backend/src/controllers/chat.controller.ts:123-159` retorna `participants` e `mySettings` de uma sala mesmo quando `myParticipant` pode ser `undefined`.
- `backend/src/services/chat.service.ts:194-206` lê mensagens por `chatId` sem validar que `profileId` pertence à sala.

Recomendação:
- Exigir membership antes de `getRoomMessages`, `getRoomSettings` e qualquer leitura por `roomId`.
- Mover a checagem para `chat.service` para evitar divergência entre controllers.
- Adicionar teste negativo: usuário A não pode ler sala de usuário B.

### C2. Endpoints e analytics com escopo global ou isolamento incompleto de tenant

Impacto: risco de vazamento de métricas ou dados agregados entre espaços/contas, além de custo desnecessário em queries globais.

Evidência:
- `backend/src/routes/rooms.routes.ts:7-10` expõe `GET /rooms`, `GET /rooms/analytics` e `GET /rooms/vacancies` sem `requireRoles` específico no arquivo de rota.
- `backend/src/controllers/rooms.controller.ts:77-97` calcula analytics globais (`room.count`, `transaction.aggregate`) sem filtrar por `hub_id`.
- `backend/src/controllers/space.controller.ts:86-139` usa métricas globais (`room.count`, `appointment.count`, `profile.count`, `review.findMany({ take: 5000 })`) para analytics do domínio de espaço.
- `backend/src/controllers/space.controller.ts:286-299` lista espaços globalmente, o que é aceitável para descoberta, mas precisa ser explicitamente classificado como catálogo público autenticado, não como dado do tenant.

Recomendação:
- Separar endpoints de catálogo global dos endpoints tenant-scoped.
- Para analytics, sempre filtrar por `spaceId/hubId` quando o endpoint representar visão do espaço.
- Adicionar testes de isolamento: espaço A não vê métricas de espaço B.

## Achados Altos

### H1. `createBaseApiApp` aplica hardening mais fraco que `app.ts`

Impacto: funções serverless separadas podem subir com política de segurança diferente da API principal.

Evidência:
- `backend/src/app.ts:47-65` aplica CSP explícita via `helmet`.
- `backend/src/lib/createBaseApiApp.ts:29-33` usa `helmet({ contentSecurityPolicy: false })`.
- Entry points serverless usam `createBaseApiApp`: `backend/src/auth.fn.ts`, `backend/src/chat.fn.ts`, `backend/src/checkout.fn.ts`, `backend/src/health.fn.ts`, `backend/src/marketplace.fn.ts`, `backend/src/tribe.fn.ts`.

Recomendação:
- Extrair uma factory única de security middleware usada tanto por `app.ts` quanto por `createBaseApiApp`.
- Garantir equivalência de headers, parser limits, CORS, limiter e blocklist de debug.

### H2. Duplicação de Redis/cache cria drift operacional e risco de custo/latência

Impacto: configuração inconsistente, comportamento diferente entre rate limit e cache, e uso de comandos ruins para escala.

Evidência:
- `backend/src/lib/redis.ts:1-76` define cliente distribuído/mock-aware para rate limiting.
- `backend/src/lib/cache.ts:1-47` cria outro cliente Redis independente, com defaults `localhost` e sem awareness de serverless.
- `backend/src/lib/cache.ts:38-44` usa `KEYS`, que degrada Redis em keyspace grande.

Recomendação:
- Unificar tudo em uma única camada Redis.
- Proibir `KEYS`; usar prefix versioning ou `SCAN` controlado.
- Explicitar política de cache por domínio, TTL e invalidação.

### H3. Workflow nightly usa `MOCK_MODE=true` junto com secrets reais

Impacto: o pipeline “enterprise quality” não representa ambiente real e ainda mistura segredos reais com comportamento mock.

Evidência:
- `.github/workflows/quality.yml:14-18` injeta `DATABASE_URL`, `POSTGRES_PRISMA_URL`, `JWT_SECRET` e `MOCK_MODE: "true"`.
- `.github/workflows/quality.yml:35-47` roda checklist e build nesse contexto.

Recomendação:
- Separar workflow real de workflow mock.
- Nightly “enterprise” deve usar ambiente o mais próximo possível de produção, sem `MOCK_MODE=true`.
- Se quiser suite mock, criar job separado com nome explícito.

### H4. `queryRawUnsafe` ainda presente em reviews

Impacto: amplia superfície de erro e revisão insegura numa área que pode evoluir para filtros dinâmicos.

Evidência:
- `backend/src/controllers/reviews.controller.ts:49-58`
- `backend/src/controllers/reviews.controller.ts:107-110`

Recomendação:
- Migrar para `prisma.$queryRaw` com `Prisma.sql` ou modelagem Prisma explícita.
- Padronizar policy: `queryRawUnsafe` proibido fora de exceção revisada.

### H5. Serverless na Vercel ainda replica Prisma em múltiplas functions

Impacto: cold start maior, bundle repetido e custo operacional superior ao necessário.

Evidência:
- `vercel.json:4-88` define múltiplas funções Node separadas, todas incluindo Prisma client e schema.
- Cada função carrega `node_modules/.prisma/client/**` e `node_modules/@prisma/client/**`.

Recomendação:
- Consolidar em menos entrypoints por domínio ou avaliar trade-off entre isolamento e cold start.
- Considerar Prisma Accelerate/Data Proxy se o padrão de serverless continuar.
- Medir cold start por função antes de expandir domínios novos.

## Achados Médios

### M1. Monitoramento remoto existe, mas parte da telemetria relevante ainda fica em `console`/`localStorage`

Evidência:
- `lib/monitoring.ts:20-65` inicializa Sentry de forma lazy e opcional.
- `lib/telemetry.ts:8-17` assume buffer local + aggregate em `localStorage`.
- `lib/telemetry.ts:140-155` persiste aggregate local.
- `lib/telemetry.ts:199-219` ainda escreve em `console` em dev.

Melhoria:
- Criar transporte backend/observability real para eventos de round-trip críticos.
- Usar sampling e feature flag para não carregar telemetria detalhada em todos os usuários.
- Definir SLOs por domínio: auth, checkout, chat, appointments.

### M2. Hotspots de manutenção seguem grandes demais para um ritmo enterprise sustentável

Métricas atuais:
- `backend/src/controllers/checkout.controller.ts`: 927 linhas
- `backend/src/controllers/users.controller.ts`: 723 linhas
- `backend/src/services/gamification.service.ts`: 703 linhas
- `views/SettingsViews.tsx`: 591 linhas
- `views/metamorphosis/TimeLapseView.tsx`: 590 linhas
- `views/space/SpaceDashboard.tsx`: 545 linhas
- `services/api/auth.ts`: 546 linhas

Melhoria:
- Split por domínio funcional, não por “helpers” genéricos.
- Criar boundary de caso de uso: `finance`, `settings`, `chat`, `space-ops`, `checkout-provider`.

### M3. Ainda há ruído alto de `any`, `console` e refs de mock

Métricas atuais do workspace:
- `: any`: 282 total
- `: any` em frontend/hotspots: 116
- `console.*` fora de tests/scripts: 582
- refs `mock|fake`: 478

Melhoria:
- Meta curta: `any < 180`, `console < 250`, `mock refs < 350`.
- Tratar primeiro `App.tsx`, `views/*generated*`, `backend/controllers/*`, `qa/flows/roundtrip-evidence.spec.ts`.

### M4. `App.tsx` ainda carrega debug logs e `any` em caminhos sensíveis de sessão

Evidência:
- `App.tsx:102-119` usa `any` e `console.log` em `handleLogin`.
- `App.tsx:200-209` ainda usa `console.error` em checkout/logout.

Melhoria:
- Tipar callbacks de sessão e migrar logs para `frontendLogger/telemetry`.

### M5. Queries amplas e limites altos ainda encarecem backend conforme escala

Evidência:
- `backend/src/controllers/space.controller.ts:96-98` lê até 5000 reviews para média.
- `backend/src/controllers/space.controller.ts:369-377` lê até 500 appointments para agrupar pacientes.
- `backend/src/controllers/rooms.controller.ts:227-229` lista todas as vacancies sem paginação.
- `backend/src/services/chat.service.ts:336-351` busca vários chats privados e filtra em memória.

Melhoria:
- Paginação cursor-based onde houver lista crescente.
- Pré-agregados/materialized views para analytics.
- Índices orientados a filtros reais: `chat_messages.chat_id,created_at`, `appointments.professional_id,date`, `contracts.space_id,status`, `calendar_events.user_id,start_time`.

### M6. Bundle está dentro do budget, mas ainda há peso alto em monitoring/vendor

Métricas atuais:
- main JS: 100.5 KB
- total JS: 2029 KB
- total CSS: 149.3 KB
- maior chunk: `vendor-monitoring` 400 KB
- `vendor-core`: 279 KB
- `vendor-supabase`: 164 KB

Evidência:
- `dist/assets` auditado por `scripts/check_frontend_budget.cjs`
- `vite.config.ts:66-94` define chunking manual

Melhoria:
- Carregar replay/monitoring só em prod e por feature flag explícita de sampling.
- Revisar dependências de monitoramento para evitar incluir módulos não usados.
- Remover branch de chunking para `@prisma/client` no frontend build config (`vite.config.ts:91`) e adicionar teste que falha se frontend importar Prisma.

### M7. `SettingsViews` e `SpaceDashboard` ainda misturam persistência, UX e navegação

Evidência:
- `views/SettingsViews.tsx:65-207` concentra dados, effects, mutações, toast e controle de role numa mesma unidade.
- `views/space/SpaceDashboard.tsx:223-260` mistura export financeiro, rendering e estado de UI denso.

Melhoria:
- Extrair hooks orientados a domínio: `useSettingsProfile`, `useSettingsRoles`, `useSettingsNotifications`, `useSpaceFinanceExport`.
- Isso reduz render churn e facilita testes focados.

## Achados Baixos / Backlog Estratégico

### L1. `createBaseApiApp` e `app.ts` deveriam compartilhar bootstrap único

Hoje existe duplicação funcional de CORS, limiter, helmet, degraded mode e bloqueio de rotas. Mesmo sem bug agora, isso tende a divergir.

### L2. Há client-only intencional que ainda merece documento de produto

As 9 telas client-only não são bug, mas deveriam constar em documento formal de arquitetura para evitar que uma futura auditoria trate isso como dívida oculta.

### L3. Parte da PWA continua exigindo revisão contínua de caching e invalidation

A base está boa, mas para operação enterprise vale adicionar checklist formal de cache bust, rollback e chunk mismatch em produção.

## Roadmap recomendado

### Sprint 1 — Segurança/isolamento
- Fechar autorização de membership em chat.
- Escopar analytics e `rooms/*` por tenant/role.
- Remover `queryRawUnsafe` de reviews.
- Unificar hardening de `app.ts` e `createBaseApiApp`.

### Sprint 2 — Eficiência/custo
- Unificar Redis/cache.
- Remover `KEYS` do cache.
- Revisar queries globais de `space.controller` e `rooms.controller`.
- Medir cold start por function Vercel e consolidar entrypoints onde fizer sentido.

### Sprint 3 — Performance/leveza frontend
- Reduzir custo de `vendor-monitoring`.
- Segmentar `SettingsViews`, `SpaceDashboard`, `auth.ts`, `checkout.controller.ts`.
- Reduzir `any` e `console` nos hotspots.

### Sprint 4 — Operação enterprise
- Separar workflow nightly real de workflow mock.
- Definir SLOs/SLIs e alertas por domínio.
- Formalizar matriz de tenancy e classificação de endpoints globais vs tenant-scoped.

## Meta objetiva para próximo ciclo

- `pendingEvidenceScreensCount = 0` já está fechado.
- `queryRawUnsafe = 0`
- `rooms/space analytics` 100% tenant-scoped
- `chat room membership` validado por teste negativo
- `any < 180`
- `console < 250`
- `mock refs < 350`
- `vendor-monitoring < 200 KB`
- `Redis/cache` unificado em uma única stack

