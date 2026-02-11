# 🚀 GUIA DE TESTE LOCAL - VIVA360

## ✅ O QUE JÁ ESTÁ CONFIGURADO:

- ✅ Arquivo `.env` criado com todas as credenciais do Supabase
- ✅ Conexão com Supabase validada (9/9 testes passaram)
- ✅ 5 usuários já cadastrados no banco
- ✅ Código de autenticação corrigido (email + OAuth)

---

## 🧪 TESTE LOCAL COMPLETO

### PASSO 1: Iniciar o Backend

```bash
# Terminal 1
cd backend
npm run dev
```

Aguarde ver: `🚀 Backend rodando na porta 3000`

### PASSO 2: Iniciar o Frontend

```bash
# Terminal 2
cd .. # voltar para raiz
npm run dev
```

Aguarde ver: `Local: http://localhost:5173`

### PASSO 3: Testar Login

Abra no navegador: **http://localhost:5173/login**

#### Opção A: Login com Email/Senha

1. Use um dos emails cadastrados no banco
2. Digite a senha correta
3. Se não souber a senha, crie um novo usuário

#### Opção B: Login com Google

1. Clique em "Entrar com Google"
2. Autorize o app
3. Será criado automaticamente um perfil

---

## 🔍 COMANDOS DE TESTE

### Validar Configuração Completa
```bash
npx tsx validate-env.ts
```
**Resultado esperado**: 9/9 testes ✅

### Testar Conexão Supabase
```bash
npx tsx test-supabase.ts
```

### Teste Interativo de Login
```bash
npx tsx test-login.ts
```
Escolha:
- (1) Testar login
- (2) Criar novo usuário
- (3) Listar usuários

---

## 🐛 TROUBLESHOOTING

### ❌ "Backend não está rodando"
**Solução**: Execute `cd backend && npm run dev`

### ❌ "Invalid login credentials"
**Causas possíveis**:
1. Senha incorreta
2. Usuário não existe no Supabase Auth
3. Email não confirmado

**Solução**: 
```bash
# Criar novo usuário via script
npx tsx test-login.ts
# Escolha opção 2
```

### ❌ "Conta não autorizada"
**Causa**: Usuário existe no Supabase Auth mas não tem perfil na tabela `profiles`

**Solução automática**: O código agora cria o perfil automaticamente!

### ❌ "Google OAuth não funciona"
**Checklist**:
1. ✅ VITE_SUPABASE_URL configurada?
2. ✅ VITE_SUPABASE_ANON_KEY configurada?
3. ✅ No Supabase: Authentication → URL Configuration:
   - Redirect URL: `http://localhost:5173/login`
4. ✅ No Supabase: Authentication → Providers:
   - Google habilitado?
   - Client ID e Secret configurados?

---

## 📊 STATUS ATUAL

### ✅ FUNCIONANDO:
- Conexão com Supabase
- Leitura/escrita na tabela `profiles`
- Validação de credenciais
- Auto-criação de perfil para usuários OAuth
- Mensagens de erro melhoradas

### 🔄 PENDENTE DE TESTE:
- [ ] Login com email/senha (aguardando backend iniciar)
- [ ] Login com Google (requer configuração no Supabase)
- [ ] Criação de novo usuário
- [ ] Redirecionamento pós-login

---

## 🚀 PRÓXIMOS PASSOS

### Para Desenvolvimento Local:
1. Execute os testes acima
2. Reporte qualquer erro que aparecer
3. Teste criar um novo usuário

### Para Deploy no Vercel:
1. Configure as variáveis de ambiente (veja `VERCEL_ENV_VARS.md`)
2. Atualize `VITE_SUPABASE_AUTH_REDIRECT_URL` para o domínio do Vercel
3. No Supabase, adicione a URL do Vercel em Redirect URLs
4. Faça deploy: `vercel --prod`

---

## 📝 LOGS DE DEBUG

Se o login falhar, verifique:

### Frontend (Console do navegador):
```javascript
// Procure por:
[Login] Pre-check...
[OAuth] ...
```

### Backend (Terminal):
```
POST /api/auth/login
```

---

**Criado em**: 2026-02-11  
**Status**: ✅ Ambiente configurado, pronto para testes
