#!/usr/bin/env tsx

/**
 * Script de Diagnóstico Completo do Fluxo de Autenticação
 * 
 * Testa:
 * 1. Login com Email/Senha
 * 2. Registro com Email/Senha  
 * 3. Configuração OAuth Google
 * 4. Sincronização Backend <-> Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const AUTH_REDIRECT_URL = process.env.VITE_SUPABASE_AUTH_REDIRECT_URL;

interface DiagnosticResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function log(result: DiagnosticResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : '⏭️';
  console.log(`${icon} ${result.test}: ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
}

async function testConfiguration() {
  console.log('\n🔧 === TESTE 1: CONFIGURAÇÃO === \n');
  
  // Verifica variáveis de ambiente
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log({
      test: 'Variáveis de Ambiente',
      status: 'FAIL',
      message: 'VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas',
      details: {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
        urlPrefix: SUPABASE_URL ? SUPABASE_URL.substring(0, 20) + '...' : 'undefined'
      }
    });
    return false;
  }

  log({
    test: 'Variáveis de Ambiente',
    status: 'PASS',
    message: 'Credenciais Supabase configuradas',
    details: {
      urlPrefix: SUPABASE_URL.substring(0, 30) + '...',
      redirectUrl: AUTH_REDIRECT_URL || 'NOT SET'
    }
  });

  // Testa conectividade com Supabase
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.message.includes('relation "profiles" does not exist')) {
      log({
        test: 'Conectividade Supabase',
        status: 'WARN',
        message: 'Conectado ao Supabase mas tabela profiles não existe',
        details: { error: error.message }
      });
    } else if (error) {
      log({
        test: 'Conectividade Supabase',
        status: 'FAIL',
        message: 'Erro ao conectar com Supabase',
        details: { error: error.message }
      });
      return false;
    } else {
      log({
        test: 'Conectividade Supabase',
        status: 'PASS',
        message: 'Conexão com Supabase estabelecida'
      });
    }
  } catch (err: any) {
    log({
      test: 'Conectividade Supabase',
      status: 'FAIL',
      message: 'Exceção ao tentar conectar',
      details: { error: err.message }
    });
    return false;
  }

  return true;
}

async function testEmailPasswordLogin() {
  console.log('\n🔑 === TESTE 2: LOGIN COM EMAIL/SENHA === \n');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log({
      test: 'Login Email/Senha',
      status: 'SKIP',
      message: 'Pulado por falta de configuração'
    });
    return;
  }

  const testEmail = 'client0@viva360.com';
  const testPassword = '123456';

  // Teste 1: Login via Backend API
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    if (response.ok) {
      const data = await response.json();
      log({
        test: 'Login via Backend API',
        status: 'PASS',
        message: 'Login bem-sucedido via backend',
        details: {
          userId: data?.user?.id,
          email: data?.user?.email,
          role: data?.user?.role,
          hasToken: !!data?.session?.access_token
        }
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      log({
        test: 'Login via Backend API',
        status: 'FAIL',
        message: `Falha no login: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }
  } catch (err: any) {
    log({
      test: 'Login via Backend API',
      status: 'FAIL',
      message: 'Erro de rede ou backend indisponível',
      details: { error: err.message }
    });
  }

  // Teste 2: Login via Supabase SDK
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      log({
        test: 'Login via Supabase SDK',
        status: 'FAIL',
        message: 'Falha no login via Supabase',
        details: { error: error.message, code: error.status }
      });
    } else if (data.session) {
      log({
        test: 'Login via Supabase SDK',
        status: 'PASS',
        message: 'Login bem-sucedido via Supabase SDK',
        details: {
          userId: data.user?.id,
          email: data.user?.email,
          confirmed: !!data.user?.confirmed_at,
          provider: data.user?.app_metadata?.provider
        }
      });
    } else {
      log({
        test: 'Login via Supabase SDK',
        status: 'WARN',
        message: 'Login retornou mas sem sessão',
        details: data
      });
    }
  } catch (err: any) {
    log({
      test: 'Login via Supabase SDK',
      status: 'FAIL',
      message: 'Exceção ao tentar login',
      details: { error: err.message }
    });
  }
}

async function testOAuthConfiguration() {
  console.log('\n🌐 === TESTE 3: CONFIGURAÇÃO OAUTH GOOGLE === \n');

  if (!AUTH_REDIRECT_URL) {
    log({
      test: 'OAuth Redirect URL',
      status: 'WARN',
      message: 'VITE_SUPABASE_AUTH_REDIRECT_URL não configurada',
      details: {
        recommendation: 'Configure para http://localhost:5173/login (dev) ou sua URL de produção'
      }
    });
  } else {
    const isValid = AUTH_REDIRECT_URL.includes('/login');
    log({
      test: 'OAuth Redirect URL',
      status: isValid ? 'PASS' : 'WARN',
      message: isValid ? 'Redirect URL configurada corretamente' : 'Redirect URL não termina em /login',
      details: { redirectUrl: AUTH_REDIRECT_URL }
    });
  }

  // Verifica se Google Provider está configurado (tentativa de OAuth)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log({
      test: 'Google Provider Check',
      status: 'SKIP',
      message: 'Pulado por falta de configuração'
    });
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Tenta iniciar OAuth (não vai completar, mas podemos ver se está configurado)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: AUTH_REDIRECT_URL || 'http://localhost:5173/login',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      log({
        test: 'Google Provider Check',
        status: 'FAIL',
        message: 'Erro ao iniciar OAuth',
        details: {
          error: error.message,
          recommendation: 'Verifique se Google OAuth está habilitado no Supabase Dashboard'
        }
      });
    } else if (data.url) {
      log({
        test: 'Google Provider Check',
        status: 'PASS',
        message: 'Google OAuth está configurado (URL de redirect gerada)',
        details: {
          redirectUrlGenerated: true,
          urlPrefix: data.url.substring(0, 50) + '...'
        }
      });
    } else {
      log({
        test: 'Google Provider Check',
        status: 'WARN',
        message: 'OAuth iniciou mas sem URL de redirect',
        details: data
      });
    }
  } catch (err: any) {
    log({
      test: 'Google Provider Check',
      status: 'FAIL',
      message: 'Exceção ao testar OAuth',
      details: { error: err.message }
    });
  }
}

async function testRegistration() {
  console.log('\n📝 === TESTE 4: REGISTRO DE USUÁRIO === \n');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log({
      test: 'Teste de Registro',
      status: 'SKIP',
      message: 'Pulado por falta de configuração'
    });
    return;
  }

  const testEmail = `test_${Date.now()}@viva360test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
        role: 'CLIENT'
      })
    });

    if (response.ok) {
      const data = await response.json();
      log({
        test: 'Registro via Backend',
        status: 'PASS',
        message: 'Registro bem-sucedido',
        details: {
          userId: data?.user?.id,
          email: data?.user?.email,
          hasToken: !!data?.session?.access_token
        }
      });

      // Tenta fazer login com a conta recém-criada
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (loginError) {
        log({
          test: 'Login pós-registro (SDK)',
          status: 'FAIL',
          message: 'Não conseguiu fazer login com conta recém-criada',
          details: {
            error: loginError.message,
            possibleCause: 'Email confirmation pode estar habilitado'
          }
        });
      } else {
        log({
          test: 'Login pós-registro (SDK)',
          status: 'PASS',
          message: 'Login bem-sucedido com conta recém-criada',
          details: {
            confirmed: !!loginData.user?.confirmed_at
          }
        });
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      log({
        test: 'Registro via Backend',
        status: 'FAIL',
        message: `Falha no registro: ${response.status}`,
        details: errorData
      });
    }
  } catch (err: any) {
    log({
      test: 'Registro via Backend',
      status: 'FAIL',
      message: 'Erro ao tentar registrar',
      details: { error: err.message }
    });
  }
}

async function generateReport() {
  console.log('\n📊 === RELATÓRIO FINAL === \n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`Total de Testes: ${results.length}`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`⚠️  Avisos: ${warned}`);
  console.log(`⏭️  Pulados: ${skipped}`);

  console.log('\n=== PROBLEMAS IDENTIFICADOS ===\n');

  const issues = results.filter(r => r.status === 'FAIL' || r.status === 'WARN');
  if (issues.length === 0) {
    console.log('✨ Nenhum problema grave identificado!');
  } else {
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.test}`);
      console.log(`   Problema: ${issue.message}`);
      if (issue.details?.recommendation) {
        console.log(`   Solução: ${issue.details.recommendation}`);
      }
      console.log('');
    });
  }

  // Recomendações finais
  console.log('\n=== RECOMENDAÇÕES ===\n');

  const criticalFailures = results.filter(r => r.status === 'FAIL');
  
  if (criticalFailures.some(r => r.test.includes('Variáveis de Ambiente'))) {
    console.log('🔴 CRÍTICO: Configure as variáveis de ambiente no arquivo .env');
    console.log('   Copie .env.example para .env e preencha com suas credenciais Supabase');
  }

  if (criticalFailures.some(r => r.test.includes('Login via Supabase SDK'))) {
    console.log('🔴 Problema com login direto via Supabase:');
    console.log('   - Verifique se a conta de teste existe no banco de dados');
    console.log('   - Verifique se email confirmation está desabilitado (ou confirme o email)');
    console.log('   - Rode: npm run supabase:verify para verificar o banco');
  }

  if (criticalFailures.some(r => r.test.includes('Google Provider'))) {
    console.log('🔴 Problema com Google OAuth:');
    console.log('   - Habilite Google Provider no Supabase Dashboard');
    console.log('   - Configure Client ID e Client Secret do Google Cloud Console');
    console.log('   - Adicione as redirect URLs no Google Cloud Console');
  }

  if (!AUTH_REDIRECT_URL) {
    console.log('⚠️  Configure VITE_SUPABASE_AUTH_REDIRECT_URL para o login com Google funcionar');
  }
}

async function main() {
  console.log('🚀 Diagnóstico de Autenticação Viva360\n');
  console.log('=' .repeat(50));

  const configOk = await testConfiguration();
  
  if (configOk) {
    await testEmailPasswordLogin();
    await testOAuthConfiguration();
    await testRegistration();
  }

  await generateReport();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
