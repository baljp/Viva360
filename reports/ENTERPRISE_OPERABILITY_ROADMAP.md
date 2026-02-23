# Enterprise Operability Roadmap (Longo Prazo)

Gerado em: 2026-02-23

## 1. SLOs por endpoint/fluxo crítico + dashboards

### Escopo inicial (fase 1)
- `/api/auth/session`
- `/api/checkout/contextual`
- `/api/checkout/pay`
- `/api/alchemy/offers/*`
- `/api/recruitment/*`
- `/api/records/*`
- `/api/chat/*`
- `/api/oracle/*`

### SLOs propostos (objetivos iniciais)
- Disponibilidade API (sucesso de requisição 2xx/4xx válidos): `>= 99.5%` mensal
- Latência p95 rotas críticas de leitura: `<= 800ms`
- Latência p95 rotas críticas de escrita: `<= 1200ms`
- Taxa de erro 5xx por endpoint crítico: `< 1%`
- Taxa de falha por fluxo (fim inválido / abandono técnico): `< 3%`

### Dashboards mínimos
- Latência p50/p95/p99 por endpoint
- 5xx por endpoint e por domínio
- Erros de frontend por fluxo/etapa (`flowTelemetry`)
- Conversão de fluxo por etapa (attempt -> success/error)
- Degradação por DB (`X-Viva360-Degraded`)

## 2. Testes de resiliência (DB degraded / timeout / retry)

### Objetivo
Validar comportamento do produto sob falha parcial sem regressão de UX (sem telas presas, sem 500 genérico sem contexto).

### Matriz de cenários por domínio
- `notifications`
  - DB indisponível
  - timeout > 5s
  - retry backend falha
- `marketplace`
  - DB indisponível em listagem
  - DB indisponível em criação (deve falhar explicitamente, sem fallback silencioso)
  - resposta parcial
- `finance`
  - profile ausente
  - DB indisponível em summary
  - transações timeout

### Estratégia de teste
- Unitário: classificação de erro (`dbReadFallback`)
- Integração backend: controllers retornam `503` padronizado em runtime real e payload vazio em `MOCK/test`
- E2E QA:
  - interceptar respostas degradadas (`503`, `Retry-After`)
  - validar empty-state + retry no frontend

## 3. Políticas de rollout gradual por perfil/feature

### Princípios
- Rollout por perfil (`Buscador`, `Guardião`, `Santuário`) e por fluxo crítico
- Feature flags com kill switch operacional
- Métricas de guarda antes de expandir % de tráfego

### Fases sugeridas
1. `Internal` (time)
2. `Closed beta` (perfil específico)
3. `Canary 5–10%`
4. `Canary 25–50%`
5. `General availability`

### Gates por fase
- Sem aumento material de 5xx
- p95 dentro do SLO
- Sem regressão de conversão por etapa
- Sem novos P0/P1 em QA crítico

### Rollback policy
- Critério objetivo: `5xx > 2%` por 10 min ou quebra de fluxo crítico > limiar
- Ação: desligar feature flag / reverter release / forçar fallback
- Pós-incidente: RCA + teste de regressão obrigatório

## 4. Entregáveis técnicos futuros
- `backend metrics`: histogramas e contadores por domínio/endpoint
- `frontend flow telemetry`: agregação por etapa e outcome
- `runbooks`: degradado DB, timeout upstream, rollback canary
- `dashboards`: produto + operação + engenharia

