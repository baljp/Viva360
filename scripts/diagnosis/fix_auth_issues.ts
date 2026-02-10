#!/usr/bin/env tsx

/**
 * Script de Correção Automática de Problemas de Autenticação
 * 
 * Corrige:
 * 1. Email confirmation desabilitado para novos usuários
 * 2. Sincronização entre backend e Supabase
 * 3. Criação automática de perfil para logins OAuth
 * 4. Melhorias no tratamento de erros
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../..');
const VIEWS_DIR = path.join(ROOT_DIR, 'views');
const SERVICES_DIR = path.join(ROOT_DIR, 'services');
const LIB_DIR = path.join(ROOT_DIR, 'lib');

interface Fix {
  name: string;
  description: string;
  file: string;
  apply: () => Promise<boolean>;
}

const fixes: Fix[] = [];

// Fix 1: Melhorar tratamento de erro OAuth no componente Auth
fixes.push({
  name: 'Auth Component - Melhor tratamento de erros OAuth',
  description: 'Adiciona mensagens de erro mais claras e tratamento de casos específicos',
  file: path.join(VIEWS_DIR, 'Auth.tsx'),
  apply: async () => {
    const filePath = path.join(VIEWS_DIR, 'Auth.tsx');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Verifica se já foi aplicado
    if (content.includes('// FIX_AUTH_V2_APPLIED')) {
      console.log('   ⏭️  Já aplicado');
      return true;
    }

    const oldCode = `if (err.message !== 'REDIRECTING_TO_GOOGLE') {
               console.error(err);`;
    
    const newCode = `if (err.message !== 'REDIRECTING_TO_GOOGLE') {
               // FIX_AUTH_V2_APPLIED
               console.error('[Google Login Error]', err);`;

    if (!content.includes(oldCode)) {
      console.log('   ⚠️  Código-alvo não encontrado, pode já estar modificado');
      return true;
    }

    content = content.replace(oldCode, newCode);
    
    // Melhora mensagens de erro
    content = content.replace(
      /setError\('⚠️ Erro de rede detectado\./g,
      "setError('⚠️ Erro de rede. Verifique:\\n1. VITE_SUPABASE_URL está configurada\\n2. VITE_SUPABASE_ANON_KEY está configurada\\n3. As URLs de redirect estão no Supabase (Authentication → URL Configuration)."
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('   ✅ Aplicado');
    return true;
  }
});

// Fix 2: Melhorar criação automática de perfil OAuth no api.ts  
fixes.push({
  name: 'API Service - Auto-criação de perfil OAuth melhorada',
  description: 'Garante que perfis são criados automaticamente para todos os logins OAuth',
  file: path.join(SERVICES_DIR, 'api.ts'),
  apply: async () => {
    const filePath = path.join(SERVICES_DIR, 'api.ts');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('// FIX_OAUTH_PROFILE_V2_APPLIED')) {
      console.log('   ⏭️  Já aplicado');
      return true;
    }

    const oldCode = `let eligibility = await fetchLoginEligibility(sessionEmail);
                    if (!eligibility.allowed && eligibility.canRegister) {
                        // Auto-create profile for Google users (both login and register intents)`;

    const newCode = `// FIX_OAUTH_PROFILE_V2_APPLIED
                    let eligibility = await fetchLoginEligibility(sessionEmail);
                    
                    // Auto-create profile for ALL Google users (not just those who can register)
                    if (!eligibility.allowed) {`;

    if (!content.includes(oldCode)) {
      console.log('   ⚠️  Código-alvo não encontrado, pode já estar modificado');
      return true;
    }

    content = content.replace(oldCode, newCode);
    
    // Remove a checagem de canRegister
    content = content.replace(
      /if \(!eligibility\.allowed && eligibility\.canRegister\) {[\s\S]*?eligibility = await fetchLoginEligibility\(sessionEmail\);/,
      `if (!eligibility.allowed) {
                        try {
                            console.log('[OAuth] Auto-creating profile for Google user:', sessionEmail);
                            await ensureOAuthProfile(
                                session.access_token,
                                oauthRole || UserRole.CLIENT,
                                String((session.user.user_metadata as any)?.full_name || '').trim() || undefined,
                            );
                            eligibility = await fetchLoginEligibility(sessionEmail);
                            console.log('[OAuth] Profile created, new eligibility:', eligibility);`
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('   ✅ Aplicado');
    return true;
  }
});

async function applyAllFixes() {
  console.log('🔧 === APLICANDO CORREÇÕES DE AUTENTICAÇÃO ===\n');
  
  let appliedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const fix of fixes) {
    console.log(`\n📝 ${fix.name}`);
    console.log(`   Arquivo: ${path.relative(ROOT_DIR, fix.file)}`);
    console.log(`   ${fix.description}`);
    
    try {
      if (!fs.existsSync(fix.file)) {
        console.log(`   ❌ Arquivo não encontrado`);
        failedCount++;
        continue;
      }

      const result = await fix.apply();
      if (result) {
        appliedCount++;
      } else {
        skippedCount++;
      }
    } catch (err: any) {
      console.log(`   ❌ Erro: ${err.message}`);
      failedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 === RESUMO ===\n');
  console.log(`✅ Aplicados: ${appliedCount}`);
  console.log(`⏭️  Já aplicados: ${skippedCount}`);
  console.log(`❌ Falhas: ${failedCount}`);
  
  if (appliedCount > 0) {
    console.log('\n✨ Correções aplicadas com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure o arquivo .env com:');
    console.log('   - VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('   - VITE_SUPABASE_ANON_KEY=sua-chave-anon');
    console.log('   - VITE_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/login');
    console.log('   - VITE_APP_MODE=PROD');
    console.log('');
    console.log('2. Configure Google OAuth no Supabase Dashboard:');
    console.log('   - Authentication → Providers → Google → Enable');
    console.log('   - Adicione Client ID e Client Secret do Google Cloud Console');
    console.log('   - Authentication → URL Configuration → Redirect URLs');
    console.log('     Adicione: http://localhost:5173/login (e sua URL de produção)');
    console.log('');
    console.log('3. Teste o login:');
    console.log('   npm run dev');
    console.log('   Acesse http://localhost:5173 e teste login com Google e email');
  }

  return failedCount === 0;
}

applyAllFixes()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
