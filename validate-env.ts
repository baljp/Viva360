#!/usr/bin/env tsx
/**
 * Script de validação completa do ambiente
 * Testa todas as configurações necessárias para login funcionar
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: TestResult[] = [];

function test(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ name, status, message });
}

async function validateEnvironment() {
  console.log('\n🔍 VALIDAÇÃO COMPLETA DO AMBIENTE\n');
  console.log('='.repeat(60) + '\n');

  // 1. Verificar variáveis de ambiente
  console.log('📋 VARIÁVEIS DE AMBIENTE\n');
  
  const requiredVars = [
    { key: 'VITE_SUPABASE_URL', frontend: true },
    { key: 'VITE_SUPABASE_ANON_KEY', frontend: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', frontend: false },
    { key: 'JWT_SECRET', frontend: false },
  ];

  for (const { key, frontend } of requiredVars) {
    const value = process.env[key];
    if (value && value.trim()) {
      test(
        key,
        'pass',
        frontend ? '✓ Configurada (Frontend)' : '✓ Configurada (Backend)'
      );
    } else {
      test(key, 'fail', '✗ NÃO CONFIGURADA');
    }
  }

  // 2. Testar conexão com Supabase
  console.log('\n🔗 CONEXÃO SUPABASE\n');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    test('Supabase Connection', 'fail', 'Credenciais não configuradas');
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test 1: Get session (should return null but no error)
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        test('Auth Session', 'fail', `Erro: ${sessionError.message}`);
      } else {
        test('Auth Session', 'pass', '✓ Autenticação acessível');
      }

      // Test 2: Access profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileError) {
        test('Profiles Table', 'fail', `Erro: ${profileError.message}`);
      } else {
        test('Profiles Table', 'pass', '✓ Tabela profiles acessível');
      }

      // Test 3: Check if there are any profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5);
      
      if (profiles && profiles.length > 0) {
        test('Existing Users', 'pass', `✓ ${profiles.length} usuário(s) encontrado(s)`);
      } else {
        test('Existing Users', 'warning', 'ℹ Nenhum usuário cadastrado ainda');
      }

    } catch (error: any) {
      test('Supabase Connection', 'fail', `Erro crítico: ${error.message}`);
    }
  }

  // 3. Verificar OAuth redirect URL
  console.log('\n🔐 OAUTH CONFIGURATION\n');
  
  const redirectUrl = process.env.VITE_SUPABASE_AUTH_REDIRECT_URL;
  if (redirectUrl) {
    try {
      const url = new URL(redirectUrl);
      if (url.pathname === '/login') {
        test('OAuth Redirect URL', 'pass', `✓ ${redirectUrl}`);
      } else {
        test('OAuth Redirect URL', 'warning', `Deve terminar com /login: ${redirectUrl}`);
      }
    } catch {
      test('OAuth Redirect URL', 'fail', `URL inválida: ${redirectUrl}`);
    }
  } else {
    test('OAuth Redirect URL', 'fail', 'VITE_SUPABASE_AUTH_REDIRECT_URL não configurada');
  }

  // 4. Verificar se .env existe
  console.log('\n📁 ARQUIVOS DE CONFIGURAÇÃO\n');
  
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    test('.env file', 'pass', `✓ Encontrado: ${envPath}`);
  } else {
    test('.env file', 'fail', `✗ Não encontrado: ${envPath}`);
  }

  // Print results
  console.log('\n📊 RESUMO DOS TESTES\n');
  console.log('='.repeat(60) + '\n');

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warningCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Passou: ${passCount}  |  ❌ Falhou: ${failCount}  |  ⚠️  Avisos: ${warningCount}\n`);

  if (failCount === 0) {
    console.log('🎉 CONFIGURAÇÃO OK! Você pode iniciar o servidor.\n');
    console.log('Execute: npm run dev\n');
  } else {
    console.log('⚠️  CONFIGURAÇÃO INCOMPLETA. Resolva os erros acima.\n');
    console.log('📖 Veja: VERCEL_ENV_VARS.md para mais detalhes\n');
  }

  return failCount === 0;
}

// Run validation
validateEnvironment().catch(console.error);
