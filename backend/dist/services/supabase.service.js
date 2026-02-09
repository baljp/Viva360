"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDemoMode = exports.isMockMode = exports.createSupabaseUserClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
// Flag for Mock/Demo Mode
const IS_MOCK_MODE = APP_MODE === 'MOCK' && (TEST_MODE_ENABLED || isNonProdNode);
const IS_DEMO_MODE = APP_MODE === 'DEMO';
// Admin client with Service Role (bypass RLS for admin tasks)
let adminClient = null;
const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || 'dummy-key-for-initialization';
const effectiveUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
console.log(`[Supabase Service] Initializing with URL: ${effectiveUrl} (Source: ${SUPABASE_URL ? 'Standard' : 'VITE_ Fallback'})`);
console.log(`[Supabase Service] Mode: ${APP_MODE}`);
try {
    if (!SUPABASE_URL) {
        console.error('🚨 Backend: SUPABASE_URL missing. Auth operations will fail.');
    }
    if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
        console.error('🚨 Backend: No Supabase keys configured. Auth operations will fail.');
    }
    else if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️  Backend: SUPABASE_SERVICE_ROLE_KEY missing. Admin tasks (like registration) will fail RLS.');
    }
    adminClient = (0, supabase_js_1.createClient)(effectiveUrl, effectiveKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
catch (e) {
    console.error("Failed to init Supabase Admin:", e);
    // We don't throw here to allow the server to boot if other services are healthy
}
exports.supabaseAdmin = adminClient;
/**
 * Helper to create a client on behalf of a user (respects RLS)
 * @param accessToken JWT token from frontend
 */
const createSupabaseUserClient = (accessToken) => {
    // If in mock mode, we could return a proxy or just the admin client (dangerous in prod, ok for mock structure)
    // For now, we return standard client, assuming service layer handles mock data logic if IS_MOCK_MODE is true.
    return (0, supabase_js_1.createClient)(effectiveUrl, SUPABASE_ANON_KEY || effectiveKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
};
exports.createSupabaseUserClient = createSupabaseUserClient;
const isMockMode = () => IS_MOCK_MODE;
exports.isMockMode = isMockMode;
const isDemoMode = () => IS_DEMO_MODE;
exports.isDemoMode = isDemoMode;
