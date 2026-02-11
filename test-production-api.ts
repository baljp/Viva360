#!/usr/bin/env tsx
/**
 * Teste de API em produção - Vercel
 */

async function testProductionAPI() {
  console.log('\n🧪 TESTE DE API EM PRODUÇÃO - VERCEL\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const baseUrl = 'https://viva360.vercel.app';
  
  console.log('🔍 Testando endpoints...\n');

  // Teste 1: Health check
  console.log('1️⃣  Testando health check (GET /)...');
  try {
    const response = await fetch(baseUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      console.log('   ✅ Frontend respondendo\n');
    } else {
      console.log('   ❌ Frontend não respondeu\n');
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
  }

  // Teste 2: API Login
  console.log('2️⃣  Testando API de login (POST /api/auth/login)...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': baseUrl
      },
      body: JSON.stringify({
        email: 'teste1770782863978@viva360.com',
        password: 'senha123'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      console.log(`   Response (text): ${text.substring(0, 200)}...\n`);
      return;
    }

    if (response.ok) {
      console.log('   ✅ Login funcionou!\n');
      console.log('   Resposta:', JSON.stringify(data, null, 2).substring(0, 300), '...\n');
    } else {
      console.log('   ❌ Login falhou!\n');
      console.log('   Erro:', JSON.stringify(data, null, 2), '\n');
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO DE REDE: ${error.message}\n`);
  }

  // Teste 3: Verificar se API existe
  console.log('3️⃣  Testando se API routes existem...');
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET'
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('   ⚠️  API routes não encontradas (404)');
      console.log('   💡 Possível causa: Vercel não configurou as API routes\n');
    } else if (response.ok) {
      console.log('   ✅ API routes funcionando\n');
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📝 DIAGNÓSTICO:\n');
  console.log('Se o teste 2 falhou com 500 (Internal Server Error):');
  console.log('   → Backend está respondendo mas tem erro interno');
  console.log('   → Provavelmente DATABASE_URL ou outra variável\n');
  console.log('Se o teste 2 falhou com 404 (Not Found):');
  console.log('   → API routes não estão configuradas no Vercel');
  console.log('   → Verifique se existe pasta /api no projeto\n');
  console.log('Se o teste 2 falhou com CORS:');
  console.log('   → Configuração de CORS incorreta');
  console.log('   → Verifique variável CORS_ORIGINS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

testProductionAPI().catch(console.error);
