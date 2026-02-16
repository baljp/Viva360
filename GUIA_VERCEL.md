# 🚀 GUIA: CONFIGURAR VERCEL PARA PRODUÇÃO

## 📋 PASSO A PASSO COMPLETO

### ETAPA 1: Descobrir o domínio do Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto "Viva360"
3. Copie a URL do projeto (exemplo: `viva360-xyz.vercel.app`)

---

### ETAPA 2: Gerar variáveis de ambiente

**Opção A: Usar o script automático** (RECOMENDADO)

```bash
cd ~/Viva360
bash generate-vercel-env.sh SEU-DOMINIO.vercel.app
```

Exemplo:
```bash
bash generate-vercel-env.sh viva360-abc123.vercel.app
```

O script vai mostrar todas as variáveis prontas para copiar!

**Opção B: Manual**

Substitua `SEU-DOMINIO` pelo domínio real nas variáveis abaixo.

---

### ETAPA 3: Adicionar variáveis no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto "Viva360"
3. Vá em: **Settings** → **Environment Variables**
4. Para CADA variável abaixo, clique "Add New"
5. Cole o nome e o valor
6. Selecione: **Production, Preview, Development** (todos)
7. Clique "Save"

---

### ETAPA 4: Variáveis obrigatórias

Cole estas no Vercel (uma por uma):

#### 🔐 Supabase
```
Nome: VITE_SUPABASE_URL
Valor: https://SEU_PROJECT_REF.supabase.co
```

```
Nome: SUPABASE_URL
Valor: https://SEU_PROJECT_REF.supabase.co
```

```
Nome: VITE_SUPABASE_ANON_KEY
Valor: <SUPABASE_ANON_KEY>
```

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: <SUPABASE_SERVICE_ROLE_KEY>
```

#### 🌐 OAuth Redirect (SUBSTITUA O DOMÍNIO!)
```
Nome: VITE_SUPABASE_AUTH_REDIRECT_URL
Valor: https://SEU-DOMINIO.vercel.app/login
```
⚠️ **IMPORTANTE**: Substitua `SEU-DOMINIO` pelo domínio real!

#### 🎯 App Mode
```
Nome: VITE_APP_MODE
Valor: PROD
```

```
Nome: APP_MODE
Valor: PROD
```

```
Nome: VITE_ENABLE_TEST_MODE
Valor: false
```

#### 🔒 CORS
```
Nome: CORS_ORIGINS
Valor: https://SEU-DOMINIO.vercel.app
```
⚠️ **IMPORTANTE**: Substitua `SEU-DOMINIO` pelo domínio real!

#### 🗄️ Database
```
Nome: DATABASE_URL
Valor: postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

```
Nome: DIRECT_URL
Valor: postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

#### 🔑 Security
```
Nome: JWT_SECRET
Valor: <GERAR_COM_OPENSSL_RAND_BASE64_32>
```

#### 📡 API
```
Nome: VITE_API_URL
Valor: /api
```

---

### ETAPA 5: Configurar Supabase Redirect URLs

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_REF
2. Vá em: **Authentication** → **URL Configuration**
3. Em "Redirect URLs", adicione:
   ```
   https://SEU-DOMINIO.vercel.app/login
   https://SEU-DOMINIO.vercel.app/*
   ```
4. Em "Site URL", configure:
   ```
   https://SEU-DOMINIO.vercel.app
   ```
5. Clique "Save"

---

### ETAPA 6: Fazer redeploy

No Vercel:
1. Vá em: **Deployments**
2. Clique nos 3 pontos do último deploy
3. Clique "Redeploy"
4. Aguarde o deploy finalizar

Ou via CLI:
```bash
cd ~/Viva360
vercel --prod
```

---

### ETAPA 7: Testar em produção

1. Acesse: `https://SEU-DOMINIO.vercel.app/login`
2. Teste login com email/senha
3. Teste login com Google
4. Verifique se está tudo funcionando!

---

## 🔍 Troubleshooting

### Erro: "Redirect URL not allowed"
**Solução**: Verifique se adicionou a URL no Supabase (Etapa 5)

### Erro: "Login com Google indisponível"
**Solução**: Verifique se `VITE_SUPABASE_AUTH_REDIRECT_URL` está correta

### Erro: "Database connection failed"
**Solução**: Verifique se `DATABASE_URL` está configurada

### Variáveis não aplicadas
**Solução**: Faça redeploy (Etapa 6)

---

## 📝 Checklist Final

- [ ] Descobri meu domínio do Vercel
- [ ] Adicionei todas as 13 variáveis de ambiente
- [ ] Substitui `SEU-DOMINIO` nas URLs
- [ ] Configurei Redirect URLs no Supabase
- [ ] Fiz redeploy no Vercel
- [ ] Testei login por email
- [ ] Testei login com Google

---

## 💡 Dica Rápida

Use o script para gerar tudo automaticamente:

```bash
cd ~/Viva360
bash generate-vercel-env.sh viva360-abc123.vercel.app
```

Copie a saída e cole no Vercel!

---

**Qualquer dúvida, me avise!** 🚀
