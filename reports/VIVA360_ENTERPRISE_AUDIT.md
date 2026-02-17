# Viva360 - Auditoria Enterprise (Zero-Loss)

Gerado em: 2026-02-17

## Escopo e premissas
- Plataforma existente; objetivo: polir, estabilizar, fechar fluxos e elevar maturidade (sem reinventar produto).
- Restrições: zero-loss (sem remover telas/fluxos/endpoints; sem mudar regras de negocio; sem mudar identidade visual).
- Base tecnica observada no repo: SPA React + Vite + React Router no frontend, Node/Express serverless (Vercel) + Prisma/Supabase no backend.

## Estado atual (sinais objetivos)
- Regressao automatizada: PASS (`reports/regression_checklist.md`).
- Flow registry: PASS, `total flows = 9` (`reports/flow_registry_validation.md`).
- Matriz tela x botao x fluxo: gerada, `353 entries` (`reports/screen_button_flow_matrix.json`).
- Auditoria de secrets versionados: PASS (`reports/tracked_secret_audit.md`).
- Auditoria de bundle prod: PASS (`reports/frontend_prod_bundle_audit.md`).
- Auditoria de vazamento de rotas teste/mock: PASS (`reports/test_route_leak_audit.md`).

## Pontos fortes (o que ja esta "enterprise-ish")
- Contratos e gates automatizados: checklist roda build, audits, unit/contract tests e E2E core com saida em `reports/`.
- Fluxos multi-perfil cobertos por QA: buscador/guardiao/santuario com smoke e matrizes de interacao (Playwright).
- Health/diagnostico do backend: `/api/health` responde e permite identificar modo degradado sem derrubar tudo.
- Logging backend estruturado com redacao (PII) e niveis por ambiente (reduz risco LGPD em logs).

## Pontos frageis (risco real e/ou custo operacional alto)

### P0 - Engenharia/operacao
- Repositorio versiona `backend/node_modules/**` (e possivelmente outros artefatos grandes).
  - Impacto: explode tamanho do repo, diffs lentos, reviews ruidosos, risco de supply-chain "congelada" e builds inconsistentes.
  - Indicador: contagem de linhas rastreadas inclui dependencias (ver secao "Metricas de codigo").

### P1 - Performance/robustez
- Bundle inicial ainda relevante (varios vendors e chunks); existe code-splitting, mas ha espaco para reduzir payload por rota.
- Serverless split reduz cold start em rotas criticas, mas aumenta superficie de deploy e exige disciplina no roteamento (`vercel.json`).

### P1 - Produto/fluxos (qualidade percebida)
- Alguns fluxos dependem de modo MOCK em QA; prod precisa ter equivalentes reais para: video/atendimento, convites externos, persistencia completa de comunidade/chat em todos os contextos.
- UX de estados: padrao de empty/loading/error existe, mas nem todo modulo parece usar invariantes unificadas (risco de "tela vazia" sem explicacao).

## Fluxos e telas (inicio/meio/fim)
- Evidencia automatizada: `qa/flows/*` cobre navegacao por portais principais por perfil, deep links protegidos, back/close, toast mobile-safe e audit de links/imagens.
- Gap conhecido: automacao atual valida a "espinha dorsal" de navegacao; nao prova todos os finais de subfluxos (ex.: variantes de marketplace/rituais, modais secundarios, casos de erro).

## Botoes e interacoes
- Auditoria estatica: `scripts/audit_buttons.ts` (strict) sem achados de botoes claramente mortos em `views/` e `components/`.
- Auditoria dinamica: E2E core valida navegacao e acoes criticas sem dead-end aparente.
- Gap: auditoria estatica nao detecta botoes com handler "no-op" nem acoes condicionais (feature flags, permissao, dados).

## Interacao entre perfis
- Evidencia: testes `qa/flows/pairing-matrix.spec.ts` e `qa/flows/interprofile.flow.spec.ts` cobrem combinacoes e invariantes de acessibilidade.
- Gap: vinculo externo (convites) e sincronizacao multi-dispositivo ainda precisam de validacao real-prod (fora do MOCK).

## Gamificacao e "calm UX"
- Estrutura existe (karma, jornadas, jardim/metamorfose/rituais), e a navegacao foi estabilizada.
- Gap: falta uma politica unica de "feedback simbolico" (quando aparece, onde aparece, como some) para evitar ruido visual em telas densas.

## Backend e integracoes
- Auth: smoke/QA cobre login e Google em MOCK; prod depende de configuracao Supabase e redirect correto.
- LGPD: existe gate para bloquear admin em prontuario (testado). Gap comum: auditar TODOS endpoints sensiveis para garantir que nao existe "rota alternativa" sem gate.

## Metricas de codigo (por que o numero de linhas assusta)
- Linhas rastreadas (inclui dependencias versionadas): ~1.17M linhas em arquivos `ts/tsx/js/jsx/json/css/scss/md`.
- Linhas apenas em `backend/node_modules/**`: ~1.087M.
- Linhas "codigo do produto" (exclui `node_modules`, `backend/node_modules`, `dist`, relatórios): ~75k.

## Recomendacoes incrementais (sem ruptura)

### Curto prazo (1-3 dias) - polimento e estabilidade
- Remover dependencias versionadas do repo (migrar para install no build), mantendo build reprodutivel via lockfile.
- Expandir matriz Tela x Botao x Fluxo com "endpoints reais por tela" (mapear services usados por view, nao so inferencia).
- Transformar os flakes de QA em determinismo: capturar screenshot/video em falha e aplicar retries controlados apenas onde necessario.

### Medio prazo (1-2 semanas) - maturidade de arquitetura
- Consolidar "API contracts": zod schemas/DTOs por dominio + contract tests por rota critica.
- Padronizar estados de tela (loading/empty/error) com componentes base e guidelines por dominio.
- Estruturar feature flags (APP_MODE/mock) com stripping build-time e auditoria automatica de vazamento.

### Longo prazo (2-6 semanas) - escala e produto
- Observabilidade prod: traces/metrics por rota critica (auth, chat, checkout, agenda) com amostragem e redacao PII.
- Video/atendimento real com audit trail (inicio/fim, permissao, fallback, qualidade).
- Comunidade/Tribo: moderacao leve + anti-spam + rituais coletivos agendados (sem poluir home).

## Avaliacao final (hoje)
- Nota tecnica atual: 7.8/10
  - Justificativa: gates/QA + contratos + hardening ja existem; faltam remover peso operacional (deps versionadas) e completar a trilha "real-prod" em algumas integracoes.
- Nota projetada apos correcoes curtas + medio prazo: 9.2/10
  - Justificativa: reduzir risco operacional e consolidar contratos/states remove regressao silenciosa e melhora previsibilidade.

