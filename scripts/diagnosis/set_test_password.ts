
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/.env' });
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/backend/.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setTestPassword() {
  const email = 'bal1982@gmail.com';
  const newPassword = 'Viva360@TestPassword';

  console.log(`Setting password for ${email}...`);

  // 1. Find user ID from profile
  const { data: profile, error: pError } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (pError || !profile) {
    console.error('User profile not found:', pError?.message);
    process.exit(1);
  }

  console.log(`User ID: ${profile.id}`);

  // 2. Update password in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword
  });

  if (error) {
    console.error('Failed to update password:', error.message);
    process.exit(1);
  }

  // 3. Update password in Prisma (if existing)
  // We don't have PRISMA setup here but the login function will try Supabase first.
  // Actually, our updated login function will try Supabase native first, so this is enough.

  console.log(`✅ Password successfully updated for ${email}`);
  process.exit(0);
}

setTestPassword().catch(err => {
  console.error(err);
  process.exit(1);
});
