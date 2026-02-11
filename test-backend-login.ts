#!/usr/bin/env tsx
/**
 * Teste rápido de login via API
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testLogin() {
  console.log('\n🔐 TESTE DE LOGIN VIA API BACKEND\n');

  const baseUrl = 'http://localhost:3000'; // Backend API
  
  // Test 1: Health check
  console.log('1️⃣ Verificando se backend está rodando...');
  try {
    const healthRes = await fetch(`${baseUrl}/health`);
    if (healthRes.ok) {
      console.log('✅ Backend está online!\n');
    } else {
      console.log('❌ Backend retornou erro:', healthRes.status);
      console.log('⚠️  Execute: cd backend && npm run dev\n');
      return;
    }
  } catch (err: any) {
    console.log('❌ Backend não está rodando!');
    console.log('⚠️  Execute: cd backend && npm run dev\n');
    return;
  }

  // Test 2: Get existing user
  console.log('2️⃣ Buscando usuário de teste...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('email')
    .limit(1);

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado. Crie um primeiro!\n');
    return;
  }

  const testEmail = profiles[0].email;
  console.log(`✅ Usuário encontrado: ${testEmail}\n`);

  // Test 3: Try login
  console.log('3️⃣ Testando login...');
  console.log('   Email:', testEmail);
  console.log('   Senha: (você precisará saber a senha deste usuário)\n');

  console.log('💡 Para testar login completo, use:');
  console.log('   npx tsx test-login.ts\n');
  
  console.log('   OU teste no frontend:');
  console.log('   1. Execute: npm run dev');
  console.log('   2. Acesse: http://localhost:5173/login');
  console.log('   3. Tente fazer login com:', testEmail);
  console.log('\n');
}

testLogin().catch(console.error);
