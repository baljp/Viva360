import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const explicitMode = String(process.env.APP_MODE || '').toUpperCase();
const isNodeTest = process.env.NODE_ENV === 'test';
const isNonProdNode = process.env.NODE_ENV !== 'production';
const explicitTestMode = String(process.env.ENABLE_TEST_MODE || '').toLowerCase() === 'true';
const TEST_MODE_ENABLED = explicitTestMode || isNodeTest;
const APP_MODE = explicitMode === 'MOCK'
  ? ((TEST_MODE_ENABLED || isNonProdNode) ? 'MOCK' : 'PROD')
  : (explicitMode || 'PROD');
const isProd = process.env.NODE_ENV === 'production';

// Flag for Mock/Demo Mode
const IS_MOCK_MODE = APP_MODE === 'MOCK' && (TEST_MODE_ENABLED || isNonProdNode);
const IS_DEMO_MODE = APP_MODE === 'DEMO';

// Admin client with Service Role (bypass RLS for admin tasks)
let adminClient: SupabaseClient | null = null;

const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || 'dummy-key-for-initialization';
const effectiveUrl = SUPABASE_URL || 'https://placeholder.supabase.co';

console.log(`[Supabase Service] Initializing with URL: ${effectiveUrl} (Source: ${SUPABASE_URL ? 'Standard' : 'VITE_ Fallback'})`);
console.log(`[Supabase Service] Mode: ${APP_MODE}`);

try {
  if (isProd) {
      if (!SUPABASE_URL) {
        throw new Error('SUPABASE_URL missing in production.');
      }
      if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY missing in production.');
      }
      if (APP_MODE === 'MOCK' || APP_MODE === 'DEMO') {
        throw new Error(`APP_MODE ${APP_MODE} not allowed in production.`);
      }
  }

  if (!SUPABASE_URL) {
      console.error('🚨 Backend: SUPABASE_URL missing. Auth operations will fail.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
      console.error('🚨 Backend: No Supabase keys configured. Auth operations will fail.');
  } else if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️  Backend: SUPABASE_SERVICE_ROLE_KEY missing. Admin tasks (like registration) will fail RLS.');
  }
  
  adminClient = createClient(effectiveUrl, effectiveKey, {
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
  return createClient(effectiveUrl, SUPABASE_ANON_KEY || effectiveKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export const isMockMode = () => IS_MOCK_MODE;
export const isDemoMode = () => IS_DEMO_MODE;
