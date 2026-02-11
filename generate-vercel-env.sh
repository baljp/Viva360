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

VERCEL_DOMAIN="$1"

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
VITE_SUPABASE_URL=https://oqhzisdjbtyxyarjeuhp.supabase.co
SUPABASE_URL=https://oqhzisdjbtyxyarjeuhp.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Mjc0MTIsImV4cCI6MjA4NTEwMzQxMn0.ae0_uaZQJT6y583NMuwyUUI9MUuY9zuRXcVdDgz6ExU

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUyNzQxMiwiZXhwIjoyMDg1MTAzNDEyfQ.WzLMzrHgK_gsvt1I6kRaFJiQHpei9650nFKpqFQAHks

# --- OAUTH REDIRECT (IMPORTANTE!) ---
VITE_SUPABASE_AUTH_REDIRECT_URL=https://$VERCEL_DOMAIN/login

# --- APP MODE ---
VITE_APP_MODE=PROD
APP_MODE=PROD
VITE_ENABLE_TEST_MODE=false

# --- CORS ---
CORS_ORIGINS=https://$VERCEL_DOMAIN

# --- DATABASE ---
DATABASE_URL=postgresql://postgres:207tAwUiYOcwxgIn@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:207tAwUiYOcwxgIn@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres

# --- SECURITY ---
JWT_SECRET=I9Y60Mngk1MswjB9DYJi+ar+pcGkOYzmx9W+4cTndwE=

# --- API ---
VITE_API_URL=/api
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE: Depois de adicionar as variáveis:"
echo ""
echo "1. Vá ao Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/oqhzisdjbtyxyarjeuhp"
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
