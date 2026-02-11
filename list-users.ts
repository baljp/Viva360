#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function listUsers() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  console.log('\n📋 USUÁRIOS CADASTRADOS NO SUPABASE:\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado.');
    return;
  }

  profiles.forEach((p, i) => {
    console.log(`${i + 1}. 📧 ${p.email}`);
    console.log(`   👤 Nome: ${p.name || 'N/A'}`);
    console.log(`   🎭 Role: ${p.role}`);
    console.log(`   📅 Criado: ${new Date(p.created_at).toLocaleDateString()}\n`);
  });

  console.log(`\n✅ Total: ${profiles.length} usuário(s)\n`);
}

listUsers().catch(console.error);
