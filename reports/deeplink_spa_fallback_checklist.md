# Deep Links + SPA Fallback Checklist (Vercel)

## Objetivo

Evitar `404 NOT_FOUND` em rotas diretas (refresh / colar URL) no frontend SPA.

## Status atual (repo)

- `vercel.json` já possui fallback SPA para rotas não-API:
  - `"/"` -> `"/index.html"`
  - `"/((?!api(?:/|$)|assets(?:/|$)|.*\\..*).*)"` -> `"/index.html"`
- `vercel.json` já separa rewrites de API por função (`/api/auth`, `/api/chat`, etc.) e fallback `/api/(.*)` para `backend/src/app.ts`.

## Checklist de validação (Preview e Prod)

- Confirmar que o projeto publicado usa o `vercel.json` do branch/commit atual.
- Validar `GET` direto no navegador (sem navegação interna) para rotas críticas:
  - `/`
  - `/login`
  - `/client/home`
  - `/pro/home`
  - `/space/home`
  - `/client/tribe`
  - `/oracle`
- Validar refresh (`Cmd+Shift+R`) nas mesmas rotas.
- Confirmar que rotas de asset continuam servindo arquivo (sem cair no fallback):
  - `/assets/...js`
  - `/favicon.ico`
- Confirmar que rotas `/api/*` não recebem HTML de fallback:
  - `/api/health`
  - `/api/auth/precheck-login` (POST)
- Validar respostas em Preview e Production com mesmo domínio de callback/auth configurado.

## Checklist de autenticação (relacionado a deep links)

- Abrir rota protegida direto (`/client/home`) sem sessão e confirmar redirect/guard consistente.
- Abrir rota protegida direto com sessão válida e confirmar hidratação sem tela branca.
- Validar cookie HttpOnly de auth presente após login por e-mail (`Set-Cookie`).
- Validar logout limpa cookie (`/api/auth/logout`).

## Comandos úteis locais

- `npm run test:qa:deeplinks`
- `npm run test:e2e:smoke`

## Critério de aceite mínimo

- Zero `404` em rotas SPA críticas por acesso direto.
- APIs continuam retornando JSON.
- Fluxo protegido redireciona corretamente quando sem sessão.
