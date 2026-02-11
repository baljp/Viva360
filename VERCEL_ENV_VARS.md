# 🚀 VARIÁVEIS DE AMBIENTE PARA O VERCEL

## ✅ Configuração Necessária

Cole estas variáveis no **Vercel Dashboard** → **Settings** → **Environment Variables**:

### 🔐 SUPABASE (Obrigatório)
```
VITE_SUPABASE_URL=https://oqhzisdjbtyxyarjeuhp.supabase.co
SUPABASE_URL=https://oqhzisdjbtyxyarjeuhp.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Mjc0MTIsImV4cCI6MjA4NTEwMzQxMn0.ae0_uaZQJT6y583NMuwyUUI9MUuY9zuRXcVdDgz6ExU

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUyNzQxMiwiZXhwIjoyMDg1MTAzNDEyfQ.WzLMzrHgK_gsvt1I6kRaFJiQHpei9650nFKpqFQAHks
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
DATABASE_URL=postgresql://postgres:207tAwUiYOcwxgIn@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:207tAwUiYOcwxgIn@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres
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
