
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/.env' });
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/backend/.env' });

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnostic() {
  console.log('--- LOGIN DIAGNOSTIC ---');
  
  const email = process.argv[2] || 'test_login@viva360.com';
  const password = process.argv[3] || 'Viva360@Test';

  console.log(`Testing login for: ${email}`);

  // 1. Check if user exists in auth.users via Prisma
  const user = await (prisma as any).user.findUnique({
    where: { email },
    select: { id: true, email: true, encrypted_password: true }
  });

  if (!user) {
    console.log('❌ User not found in auth.users');
    return;
  }

  console.log(`✅ User found in auth.users. ID: ${user.id}`);
  console.log(`Hash in DB: ${user.encrypted_password?.substring(0, 10)}...`);

  // 2. Test manual bcrypt comparison
  if (user.encrypted_password) {
    try {
      const isValid = await bcrypt.compare(password, user.encrypted_password);
      console.log(`Manual Bcrypt Comparison: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } catch (e: any) {
      console.error(`❌ Bcrypt comparison error: ${e.message}`);
    }
  } else {
    console.log('⚠️ No encrypted_password set for this user.');
  }

  // 3. Test Supabase Auth Login
  console.log('Testing Supabase Auth Login...');
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(`❌ Supabase Auth Login FAILED: ${error.message} (${error.status})`);
  } else {
    console.log(`✅ Supabase Auth Login SUCCESS. Session established.`);
    console.log(`User ID from Supabase: ${data.user?.id}`);
  }

  // 4. Check Profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  });

  if (profile) {
    console.log(`✅ Profile found for user ID. Name: ${profile.name}`);
  } else {
    console.log('❌ Profile NOT found for user ID.');
  }
  
  process.exit(0);
}

diagnostic().catch(err => {
  console.error(err);
  process.exit(1);
});
