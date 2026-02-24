# Política de Rollout Gradual por Perfil/Feature

## Objetivo
Reduzir risco de regressão em produção liberando features por perfil, com fallback e rollback explícitos.

## Estratégia
1. Canário interno (QA + equipe) por rota/feature
2. Piloto por perfil (Buscador / Guardião / Santuário)
3. Expansão gradual por percentual de tráfego/sessões
4. Rollback automático/manual por gatilho de SLO

## Gatilhos de rollback (qualquer um)
- Error rate > SLO por 15 min em endpoint crítico
- Burn-rate >= 2x em 1h e 6h
- Falha no QA crítico pós-deploy
- Aumento de warnings novos no flow registry (categoria não conhecida)

## Fallback obrigatório por feature
- Read paths: `DegradedRetryNotice` + retry + preservação de dados locais quando possível
- Write paths: mensagem de erro explícita + não marcar sucesso visual sem receipt
- Flow engine: rota de retorno segura (`fallbackScreen`) mantida

## Segmentação sugerida
- Perfil: `CLIENT`, `PROFESSIONAL`, `SPACE`
- Domínio: `marketplace`, `finance`, `tribe`, `recruitment`, `records`, `oracle`
- Feature flag: `viva360.feature.<domain>.<feature>`

## Sequência de rollout (sugerida)
1. Observabilidade ligada
2. Canário 5%
3. 25%
4. 50%
5. 100%

## Checklist pré-rollout
- `test:backend` PASS
- `test:qa:core:critical` PASS
- `qa:validate-flow-registry` + warn gate PASS
- `qa:feature-contract-gate` PASS
- `vercel-build` PASS
