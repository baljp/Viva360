# Suíte de Resiliência (DB degraded / timeout / retry / fallback UI)

## Domínios (fase 1)
- Notifications
- Marketplace
- Finance
- Chat
- Vacancies

## Cenários obrigatórios
1. `503 DATA_SOURCE_UNAVAILABLE` -> UI mostra `DegradedRetryNotice`
2. Timeout/abort -> UI mostra fallback e mantém navegação viva
3. Retry -> tenta novamente sem travar a tela
4. Fallback parcial -> preserva dados já carregados quando aplicável

## Evidência automatizada
- Playwright QA (`qa/flows/read-resilience.spec.ts`)
- Interceptação de `/api/*` com `route.fulfill` e `route.abort`

## Gate sugerido (fase 2)
- smoke de resiliência em CI noturno
- subset dos 2 cenários mais críticos no CI do `main`
