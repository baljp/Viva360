
# Viva360 - Ecossistema Holístico

Plataforma de bem-estar construída com React e Vite.

## ⚠️ Configuração Obrigatória do Supabase

Para que o aplicativo funcione, você precisa conectar seu projeto Supabase.

### 1. Configurar Variáveis de Ambiente (Chaves de API)
O erro "Invalid API key" ocorre se este passo for pulado.

1. Crie um arquivo chamado `.env` na raiz do projeto.
2. Copie o conteúdo de `.env.example` para dentro dele.
3. No painel do Supabase, vá em **Project Settings** > **API**.
4. Preencha o arquivo `.env` com seus dados:
   ```env
   VITE_SUPABASE_URL=sua_url_do_projeto (Ex: https://xyz.supabase.co)
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_public (Começa com eyJ...)
   ```

### 2. Configurar Autenticação (Painel Supabase)
1. Vá em **Authentication** > **Providers**.
2. Clique em **Email**:
   - Ative a opção **Enable Email provider**.
   - (Recomendado para testes) Desative **Confirm email**.
   - Clique em **Save**.
3. (Opcional) Para usar Login com Google, configure o provider Google com suas chaves de Cloud.

### 3. URLs de Redirecionamento
1. Vá em **Authentication** > **URL Configuration**.
2. Em **Site URL**, coloque a URL onde seu app está rodando (ex: `http://localhost:5173`).
3. Em **Redirect URLs**, adicione a mesma URL.

### 4. Configurar Banco de Dados (Prisma = fonte de verdade)
1. Garanta `DATABASE_URL` válido no `.env`.
2. Rode:
   ```bash
   npm run supabase:setup
   ```
3. Valide drift:
   ```bash
   npm run db:drift-check
   ```

### 5. Política de Cadastro (convite/allowlist)
- Cadastro e OAuth só funcionam para e-mails pré-autorizados.
- Para liberar um e-mail:
  ```bash
  npm run allowlist:add -- email@dominio.com CLIENT APPROVED
  ```

## Comandos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Rodar localmente:**
   ```bash
   npm run dev
   ```
