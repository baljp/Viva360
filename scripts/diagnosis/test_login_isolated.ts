
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/.env' });
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/backend/.env' });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function testLoginLogic() {
  const email = 'bal1982@gmail.com';
  const password = 'Viva360@TestPassword';
  const normalizedEmail = email.trim().toLowerCase();

  console.log(`--- ISOLATED LOGIN TEST ---`);
  console.log(`Email: ${normalizedEmail}`);

  // 1. Backend standard flow: Check Prisma first
  const user = await (prisma as any).user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    console.error('❌ User not found in Prisma auth.users');
    return;
  }
  console.log('✅ User found in Prisma');

  // 2. Native Supabase Login (The FIX)
  console.log('Testing Supabase native verification...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: password
  });

  if (error) {
    console.error(`❌ Native verification FAILED: ${error.message}`);
    return;
  }
  console.log('✅ Native verification SUCCESS');
  console.log(`User ID: ${data.user?.id}`);

  // 3. Profile existence check
  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  });

  if (profile) {
    console.log(`✅ Profile verified. Name: ${profile.name}`);
  } else {
    console.log('⚠️ Profile missing (would trigger auto-creation in actual code)');
  }

  console.log('--- TEST COMPLETE: LOGIC CONFIRMED ---');
  process.exit(0);
}

testLoginLogic().catch(err => {
  console.error(err);
  process.exit(1);
});
