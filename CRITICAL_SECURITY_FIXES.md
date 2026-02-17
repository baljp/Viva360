# 🔴 CRITICAL PRIORITY — Security & Data Fixes

**Data**: 2026-02-17
**Itens**: SEC-01, SEC-02, SEC-03, DATA-01, DATA-02
**Arquivos modificados**: 11

---

## SEC-01: Mock Token Removido do Código Fonte ✅

**Problema**: Token `admin-excellence-2026` hardcoded em 7 arquivos do repositório.
Qualquer pessoa com acesso ao código-fonte (GitHub público) tinha a chave de admin.

**Solução**:
- Backend: `auth.middleware.ts` agora lê `process.env.MOCK_AUTH_TOKEN`
- Frontend: `services/api.ts` agora lê `import.meta.env.VITE_MOCK_AUTH_TOKEN`
- Testes: Todos os 5 arquivos de teste migrados para `process.env.MOCK_AUTH_TOKEN || 'test-token-e2e'`
- `.env.example` atualizado com `MOCK_AUTH_TOKEN=` e `VITE_MOCK_AUTH_TOKEN=`

**Verificação**: `grep -r "admin-excellence-2026"` retorna ZERO resultados.

**Ação pós-deploy**: Gerar token único por ambiente:
```bash
openssl rand -hex 24
```

---

## SEC-02: Validação Explícita NODE_ENV=production ✅

**Problema**: Se Vercel fosse configurado com `APP_MODE=MOCK` acidentalmente,
mock tokens teriam acesso admin em produção.

**Solução** (3 camadas de proteção):

1. **runtimeGuard.ts**: Agora detecta `MOCK_ENABLED=true` e `MOCK_AUTH_TOKEN` como issues críticas
   em produção → retorna HTTP 503 em `/api/health` e bloqueia todas as rotas `/api/*`.

2. **auth.middleware.ts**: `isMockTokenEnabled` agora exige `!isProd && !!MOCK_AUTH_TOKEN && mockFlagEnabled`.
   Mesmo que todas as flags estejam erradas, `isProd` sozinho já bloqueia.

3. **DATA-02 guard**: Linha explícita no middleware que retorna 403 se token mock for enviado
   em produção, ANTES de qualquer outra lógica.

**Arquivos**: `runtimeGuard.ts`, `auth.middleware.ts`

---

## SEC-03: setTimeout Removido de Views Financeiras ✅

**Problema**: `WalletViewScreen` e `ProFinance` usavam `setTimeout` para simular
operações financeiras (saque, doação, relatório). Usuário via "Saque Solicitado"
mas nada persistia no backend.

**Solução**:

### WalletViewScreen.tsx
- **Transações**: Agora carrega via `request('/finance/transactions')` com `useEffect`
  + loading spinner + fallback para `state.data.transactions`
- **Saque** (`handleWithdrawConfirm`): setTimeout removido. Mostra "Funcionalidade em
  Implementação" com notify('info'). Código preparado para ativar `POST /finance/withdraw`
  quando endpoint existir (comentado com instruções).
- **Doação** (`handleDonateConfirm`): Mesmo padrão — honesto "Em Implementação".
- **Reinvestir** (`handleReinvestConfirm`): Mesmo padrão.

### ProFinance.tsx
- **Transações**: Agora carrega via `request('/finance/transactions')` com useEffect
  + loading state + fallback para props.
- **Relatório PDF**: setTimeout removido. Mostra "Em Implementação".

**Nenhum dado falso é mais apresentado ao usuário como real.**

---

## DATA-01: Flag Unificada de Mock ✅

**Problema**: Mock mode dependia de cadeia complexa de condições espalhadas:
`isSupabaseMock`, `TEST_MODE_ENABLED`, `isLocalDevRuntime()`, `isTestModeActivated()`,
`canUseMockSession()`, `getSessionMode()` — 6+ funções com localStorage checks.

**Solução**: Nova flag `MOCK_ENABLED` / `VITE_MOCK_ENABLED` como fonte única de verdade.

| Layer | Var | Onde |
|---|---|---|
| Backend | `MOCK_ENABLED=true` | `auth.middleware.ts`, `runtimeGuard.ts` |
| Frontend | `VITE_MOCK_ENABLED=true` | `lib/supabase.ts`, `services/api.ts` |

**Efeito cascata**:
- `isMockMode` em `lib/supabase.ts` agora exige `mockEnabledFlag`
- `canUseMockSession()` em `services/api.ts` agora exige `MOCK_ENABLED`
- `isTestRuntimeAllowed()` agora exige `MOCK_ENABLED`
- `isTestModeActivated()` retorna `false` se `!MOCK_ENABLED`

**Para ativar mock em dev local**: 
```env
MOCK_ENABLED=true
VITE_MOCK_ENABLED=true
MOCK_AUTH_TOKEN=meu-token-local
VITE_MOCK_AUTH_TOKEN=meu-token-local
APP_MODE=MOCK
```

---

## DATA-02: Middleware de Rejeição em Produção ✅

**Problema**: Se token mock chegasse ao backend em produção, dependia apenas de
`isMockTokenEnabled` ser `false` — mas se alguém errasse env vars, passaria direto.

**Solução**: Guard explícito ANTES da lógica normal:

```typescript
// auth.middleware.ts — linha 64
if (isProd && MOCK_AUTH_TOKEN && token === MOCK_AUTH_TOKEN) {
  return res.status(403).json({ 
    error: 'Mock tokens are forbidden in production.', 
    code: 'MOCK_TOKEN_BLOCKED' 
  });
}
```

Retorna **403 Forbidden** com código `MOCK_TOKEN_BLOCKED`.
Teste unitário atualizado para validar este comportamento.

---

## Arquivos Modificados

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `backend/src/middleware/auth.middleware.ts` | SEC-01, SEC-02, DATA-01, DATA-02 |
| 2 | `backend/src/lib/runtimeGuard.ts` | SEC-02, DATA-01 |
| 3 | `services/api.ts` | SEC-01, DATA-01 |
| 4 | `lib/supabase.ts` | DATA-01 |
| 5 | `views/pro/financial/WalletViewScreen.tsx` | SEC-03 |
| 6 | `views/pro/ProFinance.tsx` | SEC-03 |
| 7 | `.env.example` | SEC-01, DATA-01 |
| 8 | `backend/src/tests/auth.middleware.test.ts` | SEC-01, DATA-02 |
| 9 | `qa/utils/mock-fixtures.ts` | SEC-01 |
| 10 | `qa/flows/interaction-contracts.spec.ts` | SEC-01 |
| 11 | `backend/e2e_excellence_verify.ts` | SEC-01 |

---

## Checklist Pós-Deploy

- [ ] Gerar `MOCK_AUTH_TOKEN` único para cada ambiente dev/CI
- [ ] Confirmar que Vercel production NÃO tem `MOCK_ENABLED`, `MOCK_AUTH_TOKEN`, ou `APP_MODE=MOCK`
- [ ] Rodar `GET /api/health` em produção e validar `status: "ok"` sem `configIssues`
- [ ] Rodar testes: `cd backend && npx vitest run src/tests/auth.middleware.test.ts`
- [ ] Atualizar `.env` local com as novas variáveis do `.env.example`
