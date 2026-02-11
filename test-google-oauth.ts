#!/usr/bin/env tsx
/**
 * Teste de configuração do Google OAuth
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGoogleOAuth() {
  console.log('\n🔐 TESTE DE CONFIGURAÇÃO GOOGLE OAUTH\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const redirectUrl = process.env.VITE_SUPABASE_AUTH_REDIRECT_URL;

  console.log('📋 VARIÁVEIS DE AMBIENTE:\n');
  console.log('✓ VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
  console.log('✓ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');
  console.log('✓ VITE_SUPABASE_AUTH_REDIRECT_URL:', redirectUrl || '❌ Não configurada');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Variáveis de ambiente não configuradas!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🧪 TESTANDO OAUTH:\n');

  try {
    // Tentar iniciar OAuth (não vai redirecionar porque estamos em Node)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.log('❌ ERRO AO INICIAR OAUTH:\n');
      console.log('   Mensagem:', error.message);
      console.log('   Status:', error.status || 'N/A');
      console.log('');
      
      if (error.message.includes('provider') || error.message.includes('enabled')) {
        console.log('💡 DIAGNÓSTICO:');
        console.log('   O Google OAuth NÃO está habilitado no Supabase!');
        console.log('');
        console.log('📝 COMO HABILITAR:');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/oqhzisdjbtyxyarjeuhp');
        console.log('   2. Vá em: Authentication → Providers');
        console.log('   3. Habilite "Google"');
        console.log('   4. Configure Client ID e Client Secret do Google Cloud');
        console.log('');
      }
    } else if (data?.url) {
      console.log('✅ OAUTH CONFIGURADO CORRETAMENTE!\n');
      console.log('   URL de redirecionamento gerada:', data.url.substring(0, 80) + '...');
      console.log('');
      console.log('✅ O Google OAuth está funcionando!');
      console.log('');
    } else {
      console.log('⚠️  RESPOSTA INESPERADA:', JSON.stringify(data, null, 2));
    }

    // Verificar configuração de redirect URLs
    console.log('📝 VERIFICAR NO SUPABASE:\n');
    console.log('   Acesse: https://supabase.com/dashboard/project/oqhzisdjbtyxyarjeuhp');
    console.log('   Vá em: Authentication → URL Configuration');
    console.log('');
    console.log('   Redirect URLs devem incluir:');
    console.log('   ✓ http://localhost:5173/login (para desenvolvimento)');
    console.log('   ✓ https://seu-dominio.vercel.app/login (para produção)');
    console.log('');
    console.log('   Site URL deve ser:');
    console.log('   ✓ http://localhost:5173 (para desenvolvimento)');
    console.log('');

  } catch (err: any) {
    console.error('❌ ERRO CRÍTICO:', err.message);
  }
}

testGoogleOAuth().catch(console.error);
