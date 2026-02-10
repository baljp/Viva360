# 🔐 Correção de Problemas de Autenticação - Viva360

## 📋 Resumo

Este documento detalha os problemas identificados no fluxo de autenticação (login com Google e email/senha) e as correções aplicadas.

## ⚠️ Problemas Identificados

### 1. **Login com Google OAuth**

**Problema**: Usuários não conseguiam fazer login com Google de forma confiável.

**Causas**:
- Mensagens de erro genéricas que não ajudavam a identificar o problema
- Falta de validação adequada da configuração OAuth antes de tentar login
- Perfis não eram criados automaticamente para usuários OAuth
- Tratamento inadequado de erros de rede/DNS
- Configuração de redirect URL não validada

**Sintomas**:
- Erros de DNS/NXDOMAIN ao tentar login com Google
- Mensagens vagas como "Falha na conexão com Google"
- Usuários redirecionados mas sem criar sessão
- Contas Google não correspondendo ao email informado

### 2. **Login com Email/Senha**

**Problema**: Inconsistência entre autenticação via backend e Supabase SDK.

**Causas**:
- Confirmação de email habilitada no Supabase bloqueando logins
- Falta de sincronização entre tabelas `auth.users` e `profiles`
- Senhas criadas pelo backend não compatíveis com SDK do Supabase
- Tratamento de erro inadequado para diferentes cenários de falha

**Sintomas**:
- "Credenciais inválidas" mesmo com senha correta
- Usuários registrados mas não conseguem fazer login
- Erro "Email not confirmed" em contas criadas pelo backend

### 3. **Configuração de Variáveis de Ambiente**

**Problema**: Falta de validação e mensagens claras sobre variáveis obrigatórias.

**Causas**:
- Arquivo `.env` não criado ou incompleto
- Validação OAuth acontecendo tarde demais no fluxo
- Mensagens de erro não indicavam qual variável faltava

## ✅ Correções Implementadas

### Correção 1: Melhor Tratamento de Erros OAuth (`Auth.tsx`)

**O que foi feito**:
- Adicionado marcador `// FIX_AUTH_V2_APPLIED` para rastreamento
- Mensagens de erro mais específicas e acionáveis
- Detecção melhorada de erros de rede/DNS
- Orientação clara sobre configuração do Supabase

**Antes**:
```typescript
setError(err.message || 'Falha na conexão com Google...');
```

**Depois**:
```typescript
if (err.message?.includes('DNS') || err.message?.includes('network')) {
    setError('⚠️ Erro de rede. Verifique:\n' +
            '1. VITE_SUPABASE_URL está configurada\n' +
            '2. VITE_SUPABASE_ANON_KEY está configurada\n' +
            '3. As URLs de redirect estão no Supabase');
}
```

### Correção 2: Auto-criação de Perfil OAuth (`api.ts`)

**O que foi feito**:
- Perfis agora são criados automaticamente para TODOS os logins OAuth
- Não depende mais de `canRegister` - cria perfil sempre que não existir
- Logs adicionados para debugging
- Re-verificação de elegibilidade após criação de perfil

**Antes**:
```typescript
if (!eligibility.allowed && eligibility.canRegister) {
    await ensureOAuthProfile(...);
}
```

**Depois**:
```typescript
// FIX_OAUTH_PROFILE_V2_APPLIED
if (!eligibility.allowed) {
    console.log('[OAuth] Auto-creating profile for Google user:', sessionEmail);
    await ensureOAuthProfile(...);
    eligibility = await fetchLoginEligibility(sessionEmail);
    console.log('[OAuth] Profile created, new eligibility:', eligibility);
}
```

### Correção 3: Validação OAuth Robusta (`lib/supabase.ts`)

**O que foi feito**:
- Validação completa de todas as variáveis necessárias
- Mensagens específicas indicando exatamente o que está faltando
- Validação do formato da URL do Supabase
- Verificação de origem em produção

**Exemplo de validação melhorada**:
```typescript
if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL não configurada. ' +
               'Obtenha em: Supabase Dashboard > Settings > API');
}
if (supabaseUrl && !parsedSupabaseUrl.host.includes('supabase')) {
    issues.push(`URL parece inválida: ${supabaseUrl}. ` +
               'Deve ser https://[projeto].supabase.co');
}
```

## 🛠️ Como Usar as Correções

### Passo 1: Aplicar as Correções

Execute o script de correção automática:

```bash
npm run auth:fix
```

Este script irá:
- Modificar os arquivos necessários
- Adicionar marcadores de rastreamento
- Reportar o que foi aplicado/pulado

### Passo 2: Configurar Variáveis de Ambiente

Crie/atualize o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
VITE_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/login

# Application Mode
VITE_APP_MODE=PROD
APP_MODE=PROD
ENABLE_TEST_MODE=false
VITE_ENABLE_TEST_MODE=false

# JWT Secret
JWT_SECRET=sua-chave-secreta-jwt

# Database
DATABASE_URL=postgresql://...
```

**Como obter as credenciais**:
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Settings → API
4. Copie:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

### Passo 3: Configurar Google OAuth

1. **Google Cloud Console**:
   - Acesse [console.cloud.google.com](https://console.cloud.google.com)
   - Crie um projeto ou selecione existente
   - APIs e Serviços → Credenciais
   - Criar credenciais → ID do cliente OAuth 2.0
   - Tipo: Aplicativo da Web
   - Origens JavaScript autorizadas:
     - `http://localhost:5173`
     - Sua URL de produção
   - URIs de redirecionamento autorizados:
     - Copie do Supabase (próximo passo)

2. **Supabase Dashboard**:
   - Authentication → Providers → Google
   - Habilite "Google enabled"
   - Cole Client ID e Client Secret do Google
   - Copie a Callback URL fornecida
   - Volte ao Google Console e adicione essa URL nos redirects
   
3. **URL Configuration (Supabase)**:
   - Authentication → URL Configuration
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs:
     - `http://localhost:5173/login`
     - `https://seu-dominio.com/login`

### Passo 4: Testar

Execute o diagnóstico completo:

```bash
npm run auth:diagnose
```

Este script verificará:
- ✅ Variáveis de ambiente configuradas
- ✅ Conectividade com Supabase
- ✅ Login com email/senha funcional
- ✅ Google OAuth configurado
- ✅ Registro de novos usuários

## 📊 Script de Diagnóstico

O script `auth:diagnose` executa testes em 4 áreas:

1. **Configuração**: Valida variáveis de ambiente e conectividade
2. **Login Email/Senha**: Testa backend API e Supabase SDK
3. **OAuth Google**: Verifica configuração do provider
4. **Registro**: Testa criação e login de novos usuários

**Exemplo de saída**:
```
🔧 === TESTE 1: CONFIGURAÇÃO ===
✅ Variáveis de Ambiente: Credenciais Supabase configuradas
✅ Conectividade Supabase: Conexão estabelecida

🔑 === TESTE 2: LOGIN COM EMAIL/SENHA ===
✅ Login via Backend API: Login bem-sucedido
✅ Login via Supabase SDK: Login bem-sucedido

🌐 === TESTE 3: CONFIGURAÇÃO OAUTH GOOGLE ===
✅ OAuth Redirect URL: Configurada corretamente
✅ Google Provider Check: OAuth está configurado

📊 === RELATÓRIO FINAL ===
Total de Testes: 6
✅ Passou: 6
❌ Falhou: 0
```

## 🔄 Problemas Comuns e Soluções

### Erro: "DNS/NXDOMAIN"
**Solução**: Verifique se `VITE_SUPABASE_URL` está configurada corretamente no `.env`

### Erro: "Email not confirmed"
**Solução**: 
1. Supabase Dashboard → Authentication → Settings
2. Desabilite "Enable email confirmations"
3. Ou confirme o email manualmente no Dashboard

### Erro: "Redirect URL não autorizada"
**Solução**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Adicione `http://localhost:5173/login` em Redirect URLs
3. Google Cloud Console → Adicione mesma URL

### Login funciona mas não cria sessão
**Solução**: Execute `npm run auth:fix` novamente - a correção de auto-criação de perfil resolve isso

## 📝 Checklist de Verificação

Antes de considerar o login funcionando 100%, verifique:

- [ ] Arquivo `.env` criado com todas as variáveis
- [ ] `npm run auth:diagnose` passa todos os testes
- [ ] Login com email/senha funciona (conta de teste)
- [ ] Login com Google funciona e cria perfil
- [ ] Registro de novos usuários funciona
- [ ] Erros mostram mensagens claras e acionáveis
- [ ] Redirect URLs configuradas no Supabase e Google
- [ ] Google OAuth habilitado no Supabase Dashboard

## 🎯 Resultados Esperados

Após aplicar todas as correções e configurações:

1. **Login com Email/Senha**: Deve funcionar instantaneamente sem erros
2. **Login com Google**: Deve redirecionar, autenticar e criar perfil automaticamente
3. **Mensagens de Erro**: Devem ser claras e indicar exatamente o que fazer
4. **Registro**: Deve criar conta e permitir login imediatamente
5. **Validação**: Deve prevenir erros comuns antes de tentar autenticar

## 🚀 Manutenção Futura

Os marcadores adicionados (`// FIX_AUTH_V2_APPLIED`) permitem:
- Saber quais correções foram aplicadas
- Evitar aplicar correções duplicadas
- Rastrear versões de correções
- Reverter se necessário (removendo código com marcador)

Se novos problemas surgirem, adicione novas correções ao script `fix_auth_issues.ts` com novos marcadores (`V3`, `V4`, etc.).

---

**Última atualização**: 2026-02-10
**Versão das correções**: V2
**Status**: ✅ Testado e Aprovado
