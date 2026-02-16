# 🚀 VARIÁVEIS DE AMBIENTE PARA O VERCEL

## ✅ Configuração Necessária

Cole estas variáveis no **Vercel Dashboard** → **Settings** → **Environment Variables**:

### 🔐 SUPABASE (Obrigatório)
```
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co

VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>

SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
```

### 🌐 OAUTH REDIRECT (Obrigatório para Google Login)
```
VITE_SUPABASE_AUTH_REDIRECT_URL=https://SEU-DOMINIO.vercel.app/login
```
⚠️ **Importante**: Substitua `SEU-DOMINIO` pelo domínio real do Vercel!

### 🎯 MODO DA APLICAÇÃO
```
VITE_APP_MODE=PROD
APP_MODE=PROD
VITE_ENABLE_TEST_MODE=false
```

### 🔒 CORS (Frontend permitido)
```
CORS_ORIGINS=https://SEU-DOMINIO.vercel.app
```

### 🗄️ BANCO DE DADOS (Backend)
```
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

### 🔑 JWT SECRET (Backend)
```
JWT_SECRET=<< GERE UM SECRET ALEATÓRIO SEGURO >>
```
Use: `openssl rand -base64 32`

---

## 📋 CHECKLIST

- [ ] Todas as variáveis acima configuradas no Vercel
- [ ] VITE_SUPABASE_AUTH_REDIRECT_URL aponta para o domínio correto
- [ ] CORS_ORIGINS aponta para o domínio correto
- [ ] No Supabase → Authentication → URL Configuration:
  - [ ] Redirect URL adicionada: `https://SEU-DOMINIO.vercel.app/login`
  - [ ] Site URL configurada: `https://SEU-DOMINIO.vercel.app`

---

## 🔍 VERIFICAÇÃO PÓS-DEPLOY

Após configurar e fazer deploy:

1. Acesse: `https://SEU-DOMINIO.vercel.app`
2. Teste login com email/senha
3. Teste login com Google
4. Verifique o console do navegador para erros

---

## ⚠️ SEGURANÇA

**NUNCA exponha estas chaves no código-fonte:**
- ❌ SUPABASE_SERVICE_ROLE_KEY (apenas no backend/Vercel)
- ❌ JWT_SECRET
- ❌ DATABASE_URL/DIRECT_URL

**Podem ser públicas (frontend):**
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY (é pública mesmo)
