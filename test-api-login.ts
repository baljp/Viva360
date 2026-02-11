#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testLoginAPI() {
  console.log('\n🔐 TESTE DE LOGIN VIA API BACKEND\n');

  const baseUrl = 'http://localhost:3000';
  const testEmail = 'bal1982@gmail.com'; // Usuário existente
  const testPassword = '123456'; // Senha padrão de teste

  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Senha: ${testPassword}\n`);

  try {
    // Test 1: Check authorization status
    console.log('1️⃣ Verificando autorização...');
    const authRes = await fetch(`${baseUrl}/api/auth/authorization/${testEmail}`);
    const authData = await authRes.json();
    console.log('Resposta:', JSON.stringify(authData, null, 2), '\n');

    // Test 2: Try login
    console.log('2️⃣ Tentando login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    const loginData = await loginRes.json();
    
    if (loginRes.ok) {
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      console.log('Usuário:', loginData.user?.email);
      console.log('Token:', loginData.token?.substring(0, 50) + '...\n');
    } else {
      console.log('❌ LOGIN FALHOU!');
      console.log('Status:', loginRes.status);
      console.log('Erro:', JSON.stringify(loginData, null, 2), '\n');
    }

  } catch (error: any) {
    console.error('❌ ERRO NA REQUISIÇÃO:', error.message);
  }
}

testLoginAPI().catch(console.error);
