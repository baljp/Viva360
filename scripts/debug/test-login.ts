#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testAuth() {
  console.log('\n🔐 TESTE DE AUTENTICAÇÃO\n');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERRO: defina SUPABASE_URL e SUPABASE_ANON_KEY (ou VITE_SUPABASE_*) no ambiente.');
    rl.close();
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('Escolha uma opção:');
  console.log('1. Testar login com email/senha');
  console.log('2. Criar novo usuário (signup)');
  console.log('3. Listar usuários existentes\n');
  
  const choice = await question('Opção (1/2/3): ');
  
  if (choice === '1') {
    // Teste de login
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    console.log('\n⏳ Tentando login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ ERRO:', error.message);
    } else {
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      console.log('📧 Email:', data.user?.email);
      console.log('🆔 ID:', data.user?.id);
      console.log('🔑 Token:', data.session?.access_token?.substring(0, 50) + '...');
      
      // Verificar se tem perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single();
      
      if (profileError) {
        console.log('⚠️  Perfil não encontrado:', profileError.message);
      } else {
        console.log('👤 Perfil:', profile);
      }
      
      await supabase.auth.signOut();
    }
    
  } else if (choice === '2') {
    // Criar usuário
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    console.log('\n⏳ Criando usuário...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      console.error('❌ ERRO:', error.message);
    } else {
      console.log('✅ USUÁRIO CRIADO!');
      console.log('📧 Email:', data.user?.email);
      console.log('🆔 ID:', data.user?.id);
      console.log('⚠️  Confirme o email para ativar a conta');
    }
    
  } else if (choice === '3') {
    // Listar profiles
    console.log('\n⏳ Buscando perfis...');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .limit(10);
    
    if (error) {
      console.error('❌ ERRO:', error.message);
    } else {
      console.log(`\n✅ ${profiles?.length || 0} perfis encontrados:\n`);
      profiles?.forEach((p: any) => {
        console.log(`- ${p.email} (${p.role}) - criado em ${new Date(p.created_at).toLocaleDateString()}`);
      });
    }
  }
  
  rl.close();
}

testAuth().catch(console.error);
