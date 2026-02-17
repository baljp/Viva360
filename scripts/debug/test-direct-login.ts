#!/usr/bin/env tsx
/**
 * WORKAROUND: Login direto via Supabase (sem backend/Prisma)
 * Use este script enquanto não tiver DATABASE_URL configurada
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function directLogin() {
  console.log('\n🔐 LOGIN DIRETO VIA SUPABASE (WORKAROUND)\n');
  console.log('⚠️  Este método bypassa o backend e faz login direto no Supabase\n');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const email = await question('📧 Email: ');
  const password = await question('🔑 Senha: ');

  console.log('\n⏳ Tentando login...\n');

  try {
    // Login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    });

    if (error) {
      console.log('❌ ERRO DE LOGIN:');
      console.log('   Mensagem:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 POSSÍVEIS CAUSAS:');
        console.log('   1. Senha incorreta');
        console.log('   2. Email não existe no Supabase Auth');
        console.log('   3. Conta não confirmada\n');
        
        // Verificar se o email tem perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('email', email.trim())
          .single();
        
        if (profile) {
          console.log('ℹ️  DIAGNÓSTICO:');
          console.log('   ✅ Email existe na tabela profiles');
          console.log('   ❌ Mas não tem conta no Supabase Auth\n');
          console.log('💡 SOLUÇÃO:');
          console.log('   O usuário precisa se registrar primeiro');
          console.log('   Execute: npx tsx test-login.ts (opção 2)\n');
        } else {
          console.log('ℹ️  DIAGNÓSTICO:');
          console.log('   ❌ Email não existe nem em profiles nem em Auth\n');
        }
      }
      
    } else {
      console.log('✅ LOGIN BEM-SUCEDIDO!\n');
      console.log('📧 Email:', data.user?.email);
      console.log('🆔 User ID:', data.user?.id);
      console.log('🎭 Role (metadata):', (data.user?.user_metadata as any)?.role || 'N/A');
      console.log('🔑 Access Token:', data.session?.access_token?.substring(0, 50) + '...');
      
      // Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single();
      
      if (profileError) {
        console.log('\n⚠️  AVISO: Perfil não encontrado na tabela profiles');
        console.log('   Erro:', profileError.message);
      } else {
        console.log('\n👤 PERFIL:');
        console.log('   Nome:', profile.name);
        console.log('   Role:', profile.role);
        console.log('   Status:', profile.account_state || 'ACTIVE');
      }
      
      // Fazer logout
      await supabase.auth.signOut();
      console.log('\n✅ Logout realizado\n');
    }
    
  } catch (err: any) {
    console.error('❌ ERRO CRÍTICO:', err.message);
  }

  rl.close();
}

directLogin().catch(console.error);
