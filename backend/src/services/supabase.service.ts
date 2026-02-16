import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const normalizeMode = (value: string): 'MOCK' | 'DEMO' | 'PROD' | '' => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'mock') return 'MOCK';
  if (normalized === 'demo') return 'DEMO';
  if (normalized === 'prod' || normalized === 'production' || normalized === 'staging' || normalized === 'stage') {
    // staging is treated as real mode.
    return 'PROD';
  }
  return '';
};
const explicitMode = normalizeMode(String(process.env.APP_MODE || ''));
const isNodeTest = process.env.NODE_ENV === 'test';
const explicitTestMode = String(process.env.ENABLE_TEST_MODE || '').toLowerCase() === 'true';
const TEST_MODE_ENABLED = explicitTestMode || isNodeTest;
const isNonProdNode = process.env.NODE_ENV !== 'production';
const APP_MODE = explicitMode === 'MOCK'
  ? ((TEST_MODE_ENABLED && isNonProdNode) ? 'MOCK' : 'PROD')
  : (explicitMode || 'PROD');
const isProd = process.env.NODE_ENV === 'production';

// Flag for Mock/Demo Mode
const IS_MOCK_MODE = APP_MODE === 'MOCK' && TEST_MODE_ENABLED && isNonProdNode;
const IS_DEMO_MODE = APP_MODE === 'DEMO';

// Standard client for verification (using anon key)
let standardClient: SupabaseClient | null = null;
// Admin client with Service Role (bypass RLS for admin tasks)
let adminClient: SupabaseClient | null = null;

const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || 'dummy-key-for-initialization';
const effectiveUrl = SUPABASE_URL || 'https://placeholder.supabase.co';

console.log(`[Supabase Service] Initializing with URL: ${effectiveUrl} (Source: ${SUPABASE_URL ? 'Standard' : 'VITE_ Fallback'})`);
console.log(`[Supabase Service] Mode: ${APP_MODE}`);


try {
  if (isProd) {
      if (!SUPABASE_URL) {
        console.error('🚨 [Supabase Service] FATAL: SUPABASE_URL missing in production.');
        // throw new Error('SUPABASE_URL missing in production.');
      }
      if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('🚨 [Supabase Service] FATAL: SUPABASE_SERVICE_ROLE_KEY missing in production.');
        // throw new Error('SUPABASE_SERVICE_ROLE_KEY missing in production.');
      }
  }

  if (!SUPABASE_URL) {
      console.error('🚨 Backend: SUPABASE_URL missing. Auth operations will fail.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
      console.error('🚨 Backend: No Supabase keys configured. Auth operations will fail.');
  }
  
  // Safe initialization
  adminClient = createClient(effectiveUrl, effectiveKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Regular client for login verification
  standardClient = createClient(effectiveUrl, SUPABASE_ANON_KEY || effectiveKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (e) {
  console.error("Failed to init Supabase clients:", e);
  // Fallback dummy client to prevent crash
  adminClient = {
      auth: {
          admin: {
              createUser: async () => ({ error: { message: 'Supabase init failed' } }),
              updateUserById: async () => ({ error: { message: 'Supabase init failed' } }),
          }
      }
  } as any;
  standardClient = adminClient;
}

export const supabaseAdmin = adminClient!;
export const supabase = standardClient!;

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
