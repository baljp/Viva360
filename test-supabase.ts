import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oqhzisdjbtyxyarjeuhp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Mjc0MTIsImV4cCI6MjA4NTEwMzQxMn0.ae0_uaZQJT6y583NMuwyUUI9MUuY9zuRXcVdDgz6ExU';

async function testSupabase() {
  console.log('\n=== TESTE DE CONEXÃO SUPABASE ===\n');
  
  if (SUPABASE_ANON_KEY === 'COLE_AQUI_A_CHAVE_ANON_COMPLETA') {
    console.error('❌ ERRO: Cole a chave ANON do Supabase no arquivo test-supabase.ts');
    console.log('\n📝 Como obter a chave:');
    console.log('1. Acesse: https://oqhzisdjbtyxyarjeuhp.supabase.co');
    console.log('2. Vá em Settings → API');
    console.log('3. Copie a chave "anon public"');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('✅ Cliente Supabase criado com sucesso');
    console.log('🔗 URL:', SUPABASE_URL);
    
    // Teste 1: Verificar conexão
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Erro ao buscar sessão:', sessionError.message);
    } else {
      console.log('✅ Conexão estabelecida (sessão:', session.session ? 'ativa' : 'nenhuma', ')');
    }
    
    // Teste 2: Verificar tabela de profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Erro ao acessar tabela profiles:', profileError.message);
    } else {
      console.log('✅ Tabela profiles acessível');
    }
    
    // Teste 3: Teste de login (com email de teste)
    console.log('\n--- Teste de Login ---');
    const testEmail = 'teste@exemplo.com';
    const testPassword = '123456';
    
    console.log(`📧 Tentando login com: ${testEmail}`);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('ℹ️  Credenciais de teste não existem (esperado)');
      } else {
        console.error('❌ Erro inesperado no login:', loginError.message);
      }
    } else {
      console.log('✅ Login bem-sucedido!');
      await supabase.auth.signOut();
    }
    
    console.log('\n=== FIM DOS TESTES ===\n');
    
  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO:', error.message);
  }
}

testSupabase();
