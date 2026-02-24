# Status de Observabilidade Funcional (Fluxos)

## Implementado
- Emissão de eventos por fluxo (`trackFlowTelemetry`)
- Buffer local `window.__VIVA360_FLOW_TELEMETRY__`
- Evento browser `viva360:flow-telemetry`
- Agregador local + persistência `localStorage`
- Export JSON via `window.__VIVA360_GET_FLOW_TELEMETRY_EXPORT__` / `window.__VIVA360_DOWNLOAD_FLOW_TELEMETRY__`

## Próximo passo (não bloqueante)
- Coletor centralizado (upload assíncrono em ambiente de piloto)
- Join com métricas backend por timestamp/requestId
- Dashboards com conversão por etapa e burn-rate por domínio
