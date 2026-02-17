#!/usr/bin/env tsx
/**
 * Teste de cadastro via API backend (bypassa rate limit do Supabase)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testBackendSignup() {
  console.log('\n📝 TESTE DE CADASTRO VIA API BACKEND\n');

  const baseUrl = 'http://localhost:3000';
  const testEmail = `teste${Date.now()}@viva360.com`;
  const testPassword = 'senha123';
  const testName = 'Usuário Teste Backend';

  console.log('📧 Email:', testEmail);
  console.log('🔑 Senha:', testPassword);
  console.log('👤 Nome:', testName, '\n');

  try {
    console.log('⏳ Criando usuário via /api/auth/register...\n');
    
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
        role: 'CLIENT'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ USUÁRIO CRIADO COM SUCESSO!\n');
      console.log('Dados:', JSON.stringify(data, null, 2), '\n');
      console.log('═'.repeat(60));
      console.log('🎉 AGORA TESTE O LOGIN:\n');
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   🔑 Senha: ${testPassword}\n`);
      console.log('Execute: npx tsx test-direct-login.ts');
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('❌ ERRO AO CRIAR USUÁRIO');
      console.log('Status:', response.status);
      console.log('Erro:', JSON.stringify(data, null, 2), '\n');
    }

  } catch (error: any) {
    console.error('❌ ERRO NA REQUISIÇÃO:', error.message);
  }
}

testBackendSignup().catch(console.error);
