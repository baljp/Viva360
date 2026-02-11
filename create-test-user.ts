#!/usr/bin/env tsx
/**
 * Criar usuário de teste completo (Auth + Profile)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createTestUser() {
  console.log('\n👤 CRIANDO USUÁRIO DE TESTE\n');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const testEmail = `teste${Date.now()}@viva360.com`;
  const testPassword = 'senha123';
  const testName = 'Usuário de Teste';

  console.log('📧 Email:', testEmail);
  console.log('🔑 Senha:', testPassword);
  console.log('👤 Nome:', testName, '\n');

  try {
    // 1. Criar usuário no Supabase Auth
    console.log('1️⃣ Criando no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'CLIENT'
        }
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar Auth:', authError.message);
      return;
    }

    console.log('✅ Criado no Auth! User ID:', authData.user?.id, '\n');

    // 2. Criar perfil na tabela profiles
    console.log('2️⃣ Criando perfil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        email: testEmail,
        name: testName,
        role: 'CLIENT'
      });

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      console.log('⚠️  Usuário existe no Auth mas não tem perfil\n');
      return;
    }

    console.log('✅ Perfil criado!\n');

    // 3. Confirmar que deu tudo certo
    console.log('═'.repeat(60));
    console.log('🎉 USUÁRIO CRIADO COM SUCESSO!\n');
    console.log('Agora você pode fazer login com:');
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🔑 Senha: ${testPassword}\n`);
    console.log('Execute: npx tsx test-direct-login.ts');
    console.log('═'.repeat(60) + '\n');

  } catch (err: any) {
    console.error('❌ ERRO:', err.message);
  }
}

createTestUser().catch(console.error);
