# Guia de Configuração do Supabase

Siga este guia para ativar o Login com Google, Notificações e Chat em tempo real no seu projeto.

## Passo 1: Configurar Login com Google (Google Console)

1. **Acesse:** [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um **Novo Projeto** (ex: `Viva360`).
3. Vá em **APIs e Serviços > Tela de consentimento OAuth**.
   - Selecione **Externo**.
   - Preencha Nome do App, E-mail de suporte e Desenvolvedor.
4. Vá em **Credenciais > Criar Credenciais > ID do Cliente OAuth**.
   - Tipo de Aplicativo: **Aplicação da Web**.
   - Nome: `Viva360 Client` (ou qualquer um).
   - **Origens JavaScript autorizadas:** Adicione `http://localhost:5173` (e sua URL de produção depois).
   - **URIs de redirecionamento autorizados:** Adicione a URL que você copia do Supabase (ex: `https://xyz.supabase.co/auth/v1/callback`).
5. Clique em **Criar**. Uma janela aparecerá com o **ID do Cliente** e a **Chave Secreta**.
   - Copie esses dois valores para colar no Passo 2.

## Passo 2: Configurar Supabase Auth

1. **Acesse:** [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto Viva360.
3. Vá em **Authentication > Providers > Google**.
4. **Habilite** a opção "Google enabled".
5. Cole o **Client ID** e **Client Secret** copiados do Google.
6. Clique em **Save**.

## Passo 3: Executar Scripts do Banco de Dados

## Passo 3: Executar Scripts do Banco de Dados

### Opção A: Automática (Recomendada)

Se você tem a URL de conexão do banco (ex: `postgresql://...`), rode este comando no terminal:

1. Adicione `DATABASE_URL` no seu arquivo `.env`.
2. Rode:
   ```bash
   npm run supabase:setup
   ```
   _(Isso aplica todas as políticas e triggers automaticamente via script)_.

### Opção B: Manual (via Dashboard)

Se preferir usar o painel do Supabase:

1. Vá em **SQL Editor** no menu lateral.
2. Clique em **New Query**.
3. Copie o conteúdo do arquivo `supabase/master_setup.sql`.
4. Cole no editor e clique em **RUN**.

## Passo 4: Variáveis de Ambiente

No seu arquivo `.env` (local) ou nas configurações da Vercel (produção), garanta que estas variáveis estão corretas:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
# Mude para PROD para usar o Supabase real (Google Login)
VITE_APP_MODE=PROD
```

## Passo 5: Testar e Verificar (Automático)

Eu criei um robô que testa se você fez tudo certo!

1. Rode no terminal:

   ```bash
   npm run supabase:verify
   ```

2. O script vai verificar:
   - ✅ Se consegue conectar no banco.
   - ✅ Se a tabela de notificações existe.
   - ✅ Se as políticas de segurança (RLS) estão ativas.
   - ✅ Se os gatilhos (triggers) estão prontos para disparar.

**Tudo Pronto!** Seu ecossistema está vivo e conectado. 🌿
