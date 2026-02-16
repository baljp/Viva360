#!/bin/bash
# Script para gerar variáveis de ambiente do Vercel
# Execute: bash generate-vercel-env.sh SEU-DOMINIO.vercel.app

if [ -z "$1" ]; then
  echo "❌ ERRO: Forneça o domínio do Vercel"
  echo ""
  echo "Uso: bash generate-vercel-env.sh SEU-DOMINIO.vercel.app"
  echo "Exemplo: bash generate-vercel-env.sh viva360.vercel.app"
  echo ""
  exit 1
fi

VERCEL_DOMAIN=$(echo "$1" | tr -d '\r\n' | xargs)

echo "═══════════════════════════════════════════════════════════════"
echo "   📋 VARIÁVEIS DE AMBIENTE PARA O VERCEL"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Domínio configurado: https://$VERCEL_DOMAIN"
echo ""
echo "Cole estas variáveis no painel do Vercel:"
echo "Dashboard → Settings → Environment Variables"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

cat << EOF
# --- SUPABASE ---
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co

VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>

SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>

# --- OAUTH REDIRECT (IMPORTANTE!) ---
VITE_SUPABASE_AUTH_REDIRECT_URL=https://$VERCEL_DOMAIN/login

# --- APP MODE ---
VITE_APP_MODE=PROD
APP_MODE=PROD
VITE_ENABLE_TEST_MODE=false

# --- CORS ---
CORS_ORIGINS=https://$VERCEL_DOMAIN

# --- DATABASE ---
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres

# --- SECURITY ---
JWT_SECRET=<GERAR_COM_OPENSSL_RAND_BASE64_32>

# --- API ---
VITE_API_URL=/api
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE: Depois de adicionar as variáveis:"
echo ""
echo "1. Vá ao Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/SEU_PROJECT_REF"
echo ""
echo "2. Authentication → URL Configuration"
echo ""
echo "3. Adicione em 'Redirect URLs':"
echo "   https://$VERCEL_DOMAIN/login"
echo "   https://$VERCEL_DOMAIN/*"
echo ""
echo "4. Configure 'Site URL':"
echo "   https://$VERCEL_DOMAIN"
echo ""
echo "5. Faça redeploy no Vercel para as variáveis serem aplicadas!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
