#!/usr/bin/env tsx
/**
 * Teste de login via API backend
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testBackendLogin() {
  console.log('\n🔐 TESTE DE LOGIN VIA API BACKEND\n');

  const baseUrl = 'http://localhost:3000';
  const testEmail = 'teste1770782863978@viva360.com';
  const testPassword = 'senha123';

  console.log('📧 Email:', testEmail);
  console.log('🔑 Senha:', testPassword, '\n');

  try {
    console.log('⏳ Fazendo login...\n');
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ LOGIN BEM-SUCEDIDO!\n');
      console.log('👤 Usuário:', data.user?.email);
      console.log('🎭 Role:', data.user?.role);
      console.log('🔑 Token:', data.session?.access_token?.substring(0, 50) + '...\n');
      
      console.log('═'.repeat(60));
      console.log('🎉 LOGIN ESTÁ FUNCIONANDO!\n');
      console.log('Agora teste no navegador:');
      console.log('   1. Abra: http://localhost:5173/login');
      console.log('   2. Use as credenciais acima');
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('❌ LOGIN FALHOU');
      console.log('Status:', response.status);
      console.log('Erro:', JSON.stringify(data, null, 2), '\n');
    }

  } catch (error: any) {
    console.error('❌ ERRO NA REQUISIÇÃO:', error.message);
  }
}

testBackendLogin().catch(console.error);
