# Enterprise Audit Refresh — 2026-03-06

## Escopo desta passada
- liberar ao menos 2 GiB de espaço para builds
- auditar o estado atual do código e dos gates de produção
- corrigir achados concretos de segurança, build e eficiência do bundle

## Espaço em disco
- Antes da limpeza: ~582 MiB livres em `/System/Volumes/Data`
- Depois da limpeza: 2.8 GiB livres
- Caches removidos:
  - `~/Library/Caches/ms-playwright`
  - `~/Library/Caches/ms-playwright-go`
  - `~/.npm/_npx`
  - `~/.cache/prisma`
  - `.vercel/`
  - `dist/`

## Validação executada
- `npm run build:backend` — PASS
- `npm run lint` — PASS
- `npm run typecheck:frontend` — PASS
- `npm run build` — PASS
- `npm run qa:matrix` — PASS
- `npm run qa:audit-route-leaks` — PASS
- `npm run qa:audit-tracked-secrets` — PASS
- `npm run qa:audit-prod-bundle` — PASS
- `npm run perf:budget` — PASS

## Correções aplicadas nesta passada

### 1. Workflow sem segredo hardcoded no Git
Arquivo: `.github/workflows/quality.yml`

Problema anterior:
- `JWT_SECRET` fixo em texto puro no job `qa-mock`
- o audit de tracked secrets falhava

Correção:
- substituído por valor efêmero por execução:
  - `qa-mock-${{ github.run_id }}-${{ github.run_attempt }}`

Resultado:
- `qa:audit-tracked-secrets` passou

### 2. Lazy loading inefetivo da telemetria de fluxo
Arquivos:
- `index.tsx`
- `App.tsx`

Problema anterior:
- `flowTelemetryRuntime` era carregado de forma dinâmica em `index.tsx`, mas também importado estaticamente em `App.tsx`
- isso anulava o split e gerava warning de build

Correção:
- removida a importação estática e a instalação duplicada em `App.tsx`
- mantido apenas o carregamento deferred em `index.tsx`

Resultado:
- warning correspondente removido
- telemetria continua instalada fora do critical path

### 3. Import lazy de Supabase sem ganho real
Arquivo: `services/api/core.ts`

Problema anterior:
- `core.ts` fazia `import('../../lib/supabase')` dinamicamente
- `lib/supabase.ts` já era importado estaticamente por vários pontos do app
- isso gerava warning de chunking e não trazia benefício real

Correção:
- trocado para import estático de `supabase`
- removida a indireção `getSupabase()`

Resultado:
- warning correspondente removido
- fluxo de refresh de sessão ficou mais simples

### 4. Remoção de debug logs de login
Arquivo: `App.tsx`

Problema anterior:
- `console.log` de debug no fluxo de login/redirect

Correção:
- removidos logs de role e redirect

Resultado:
- menos ruído em runtime e debugging mais limpo

## Estado atual do bundle
- Main chunk: `99.81 KB`
- Total JS: `1587.1 KB`
- Total CSS: `149.3 KB`
- Budget: PASS

Observações:
- `vendor-monitoring`, `vendor-routing` e `vendor-validation` ainda aparecem como chunks vazios
- isso não quebra a build, mas indica oportunidade de simplificar a estratégia de `manualChunks`

## Métricas atuais de dívida técnica (source runtime)
- `: any` em código-fonte relevante: 157
- `console.*` em código-fonte relevante: 512
- `console-usage-audit` runtime total: 165
- `mock-reference-inventory` total: 358
- `mock-reference-inventory` risco runtime fora da allowlist: 0

## Achados remanescentes

### Alto
1. Ainda há ruído alto de `console.*` em runtime
- maior parte em frontend operacional e scripts auxiliares
- não está vazando mock em produção, mas continua ruim para observabilidade e revisão de incidentes

2. `: any` ainda está acima do alvo enterprise
- caiu em relação aos números históricos, mas 157 ainda é alto
- hotspots continuam distribuídos entre `backend/src`, `services/api` e algumas views geradas

### Médio
3. Estratégia de chunk manual ainda pode ser simplificada
- existem chunks vazios persistentes
- isso é mais custo de manutenção do que bug funcional

4. Há relatórios gerados nesta passada que mudaram no workspace
- `reports/console_usage_audit.*`
- `reports/mock_reference_inventory.*`
- servem como evidência atual da auditoria

## Priorização recomendada daqui para frente
1. reduzir `console.*` nos módulos de runtime críticos (`lib`, `src/flow`, `views/*Dashboard*`, `hooks`)
2. atacar `: any` por hotspot real de domínio, não por arquivo aleatório
3. simplificar `manualChunks` para eliminar chunks vazios
4. continuar mantendo mock segregado em `test/mock` apenas, sem regressão no runtime guard

## Veredito desta passada
- Espaço para builds: resolvido
- Gates de build e auditoria: resolvidos
- Achados concretos desta rodada: corrigidos
- O projeto ficou mais seguro e mais limpo de build, mas ainda não terminou o backlog de tipagem e ruído operacional
