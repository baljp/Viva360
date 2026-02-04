import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_MODE = process.env.APP_MODE || (SUPABASE_URL ? 'PROD' : 'MOCK');

// Flag for Mock/Demo Mode (Disabled)
const IS_MOCK_MODE = false;
const IS_DEMO_MODE = false;

// Admin client with Service Role (bypass RLS for admin tasks)
let adminClient: SupabaseClient | null = null;

const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy-key-for-initialization';

try {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️  Backend: SUPABASE_SERVICE_ROLE_KEY missing. Admin tasks (like registration) will fail RLS.');
  }
  
  adminClient = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', effectiveKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (e) {
  console.error("Failed to init Supabase Admin:", e);
  // We don't throw here to allow the server to boot if other services are healthy
}

export const supabaseAdmin = adminClient!;

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
export const isDemoMode = () => IS_DEMO_MODE;
