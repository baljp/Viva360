# Observabilidade de Conversão por Etapa (Produto + Engenharia)

## Objetivo
Medir queda de conversão por etapa de fluxo usando a telemetria funcional (`flowTelemetry`) e correlacionar com erros técnicos.

## Fonte de dados
- Eventos frontend: `trackFlowTelemetry` + agregador local/export (`window.__VIVA360_GET_FLOW_TELEMETRY_EXPORT__`)
- Backend: status code, `code`, latência por endpoint
- Catálogo de produto: `reports/feature_contract_catalog.json`

## Esquema mínimo de evento (frontend)
- `profile`
- `flow`
- `action`
- `status` (`attempt|success|error|state_change`)
- `from`, `to`
- `durationMs`
- `meta` (contexto de domínio/entidades)

## Funis prioritários (fase 1)
1. Buscador Marketplace Checkout
- etapa1: abrir marketplace
- etapa2: abrir checkout
- etapa3: pagar
- etapa4: tela de sucesso
- etapa5: histórico de pagamentos

2. Guardião Escambo
- etapa1: mural/lista
- etapa2: criar/propor oferta
- etapa3: counter/aceite
- etapa4: conclusão

3. Santuário Recrutamento
- etapa1: vagas listadas
- etapa2: candidatura criada
- etapa3: entrevista agendada/respondida
- etapa4: decisão

4. LGPD Records Consent
- etapa1: grant
- etapa2: create/list permitido
- etapa3: revoke
- etapa4: bloqueio confirmado

## Métricas por etapa
- `attempts`
- `successes`
- `errors`
- `conversionRateToNext`
- `medianDurationMs`, `p95DurationMs`
- `topErrorCodes` (join backend)

## Regras de correlação (engenharia)
- `flow/action/status=error` + backend 5xx no mesmo intervalo => suspeita técnica
- queda de conversão sem erro técnico => suspeita UX/cópia/ordem de foco
- aumento de retry com sucesso posterior => resiliente mas degradado

## Export operacional (pilotos)
- Usar `window.__VIVA360_DOWNLOAD_FLOW_TELEMETRY__()` ao final de sessões piloto
- Consolidar JSONs em pipeline analítico leve (script posterior)
