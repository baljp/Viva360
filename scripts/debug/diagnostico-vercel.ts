#!/usr/bin/env tsx
/**
 * Diagnóstico de erros em produção - Vercel
 * Verifica possíveis causas do Internal Server Error
 */

console.log('\n🔍 DIAGNÓSTICO DE ERROS - VERCEL PRODUÇÃO\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📋 CAUSAS MAIS COMUNS DO "INTERNAL SERVER ERROR":\n');

console.log('1️⃣  VARIÁVEIS DE AMBIENTE NÃO CONFIGURADAS');
console.log('   ❌ Problema: Variáveis não foram adicionadas no Vercel');
console.log('   ✅ Solução: Adicionar as 13 variáveis em Settings → Environment Variables');
console.log('   📝 Guia: cat ~/Viva360/DEPLOY_VIVA360.txt\n');

console.log('2️⃣  REDEPLOY NÃO FOI FEITO');
console.log('   ❌ Problema: Variáveis adicionadas mas deploy não foi refeito');
console.log('   ✅ Solução: Deployments → 3 pontos → Redeploy');
console.log('   ⏱️  Aguardar: 2-5 minutos para o deploy finalizar\n');

console.log('3️⃣  DATABASE_URL INCORRETA');
console.log('   ❌ Problema: String de conexão com erro');
console.log('   ✅ Solução: Verificar se está exatamente assim:');
console.log('   postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres\n');

console.log('4️⃣  SUPABASE REDIRECT URL NÃO CONFIGURADA');
console.log('   ❌ Problema: URLs não adicionadas no Supabase');
console.log('   ✅ Solução: Authentication → URL Configuration → Adicionar:');
console.log('   - https://viva360.vercel.app/login');
console.log('   - https://viva360.vercel.app/*\n');

console.log('5️⃣  BUILD FAILURE');
console.log('   ❌ Problema: Código não compila no Vercel');
console.log('   ✅ Solução: Ver logs de build no Vercel');
console.log('   📍 Local: Deployments → Último deploy → Building\n');

console.log('6️⃣  FUNÇÃO SERVERLESS COM TIMEOUT');
console.log('   ❌ Problema: Função demora mais de 10 segundos');
console.log('   ✅ Solução: Ver Function Logs no Vercel');
console.log('   📍 Local: Deployments → Último deploy → Functions\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🔧 COMO INVESTIGAR NO VERCEL:\n');
console.log('1. Acesse: https://vercel.com/dashboard');
console.log('2. Clique no projeto "Viva360"');
console.log('3. Vá em "Deployments"');
console.log('4. Clique no último deployment');
console.log('5. Verifique cada aba:\n');
console.log('   📦 Building  → Erros de compilação');
console.log('   ⚙️  Functions → Erros de runtime');
console.log('   📊 Runtime Logs → Erros durante execução\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('🎯 CHECKLIST RÁPIDO:\n');
console.log('□ Adicionei todas as 13 variáveis no Vercel?');
console.log('□ Marquei Production + Preview + Development em cada variável?');
console.log('□ Configurei Redirect URLs no Supabase?');
console.log('□ Fiz redeploy DEPOIS de adicionar as variáveis?');
console.log('□ Aguardei o deploy finalizar (2-5 min)?');
console.log('□ Verifiquei os logs de erro no Vercel?\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('💡 PRÓXIMOS PASSOS:\n');
console.log('1. Vá ao Vercel e verifique os logs');
console.log('2. Copie a mensagem de erro específica');
console.log('3. Me envie aqui para eu resolver!\n');

console.log('📝 Se precisar, me envie:\n');
console.log('   - Screenshot do erro');
console.log('   - Logs do Vercel (Building/Functions/Runtime)');
console.log('   - URL exata que está dando erro\n');

console.log('═══════════════════════════════════════════════════════════════\n');
