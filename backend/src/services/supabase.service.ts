import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️  WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file. Database interactions will fail.'
  );
}

// Flag for Mock Mode
const IS_MOCK_MODE = !SUPABASE_URL || SUPABASE_URL.includes('mock') || !SUPABASE_SERVICE_ROLE_KEY;

// Admin client with Service Role (bypass RLS for admin tasks)
let adminClient: SupabaseClient;

try {
  if (IS_MOCK_MODE) {
      console.warn('⚠️  Backend Running in MOCK MODE (Supabase credentials missing or mock flag set).');
      adminClient = createClient('https://mock.supabase.co', 'mock-key', { auth: { persistSession: false } });
  } else {
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
  }
} catch (e) {
  console.error("Failed to init Supabase Admin:", e);
  adminClient = createClient('https://mock.supabase.co', 'fallback-key');
}

export const supabaseAdmin = adminClient;

/**
 * Helper to create a client on behalf of a user (respects RLS)
 * @param accessToken JWT token from frontend
 */
export const createSupabaseUserClient = (accessToken: string): SupabaseClient => {
  // If in mock mode, we could return a proxy or just the admin client (dangerous in prod, ok for mock structure)
  // For now, we return standard client, assuming service layer handles mock data logic if IS_MOCK_MODE is true.
  return createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || '', {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export const isMockMode = () => IS_MOCK_MODE;
