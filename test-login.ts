#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = 'https://oqhzisdjbtyxyarjeuhp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHppc2RqYnR5eHlhcmpldWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Mjc0MTIsImV4cCI6MjA4NTEwMzQxMn0.ae0_uaZQJT6y583NMuwyUUI9MUuY9zuRXcVdDgz6ExU';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testAuth() {
  console.log('\n🔐 TESTE DE AUTENTICAÇÃO\n');
  
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
