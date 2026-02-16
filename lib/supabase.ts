
import { createClient } from '@supabase/supabase-js';
import { parseAllowedOrigins, resolveOAuthRedirectPolicy } from './oauthRedirectPolicy';

// Tenta pegar das variáveis de ambiente com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appMode = import.meta.env.VITE_APP_MODE;
const configuredAuthRedirect = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL;
const oauthAllowedOriginsRaw = import.meta.env.VITE_OAUTH_ALLOWED_ORIGINS;
const isTest = import.meta.env.MODE === 'test';
const isProdBuild = import.meta.env.PROD || import.meta.env.MODE === 'production';
const explicitTestMode = String(import.meta.env.VITE_ENABLE_TEST_MODE || '').toLowerCase() === 'true';
const testModeEnabled = !isProdBuild && (explicitTestMode || isTest);
const normalizeMode = (value: string): 'MOCK' | 'DEMO' | 'PROD' | '' => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return '';
    if (normalized === 'mock') return 'MOCK';
    if (normalized === 'demo') return 'DEMO';
    if (normalized === 'prod' || normalized === 'production' || normalized === 'staging' || normalized === 'stage') {
        // staging must behave as real mode (no mock shortcuts).
        return 'PROD';
    }
    return '';
};
const explicitMode = normalizeMode(String(appMode || ''));
const isBrowser = typeof window !== 'undefined';
const runtimeOrigin = isBrowser ? window.location.origin : 'http://localhost:5173';
const oauthAllowedOrigins = parseAllowedOrigins(oauthAllowedOriginsRaw);

const isLocalHostRuntime = () => {
    if (!isBrowser) return true;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
};

const resolveAppMode = (): 'PROD' | 'MOCK' | 'DEMO' => {
    if (isProdBuild) return 'PROD';
    if (!isLocalHostRuntime()) return 'PROD';
    if (explicitMode === 'DEMO') return 'DEMO';
    // MOCK mode is only allowed with explicit test flag.
    if (explicitMode === 'MOCK') return testModeEnabled ? 'MOCK' : 'PROD';
    if (explicitMode === 'PROD') return 'PROD';

    if (testModeEnabled) return 'MOCK';
    return 'PROD';
};

// Determina o modo da aplicação
export const APP_MODE = resolveAppMode();
export const TEST_MODE_ENABLED = testModeEnabled;
export const PROD_BUILD_LOCKED = isProdBuild;

// Export flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = APP_MODE === 'MOCK' && isLocalHostRuntime() && TEST_MODE_ENABLED;
export const isDemoMode = APP_MODE === 'DEMO';

// Diagnóstico para o Frontend verificar o que foi injetado pelo Vite
export const envStatus = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    hasOAuthAllowlist: oauthAllowedOrigins.length > 0,
    mode: APP_MODE,
    testModeEnabled: TEST_MODE_ENABLED,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'undefined'
};

export const getOAuthRedirectUrl = (): string => {
    if (APP_MODE === 'MOCK') {
        return `${runtimeOrigin}/login`;
    }

    const result = resolveOAuthRedirectPolicy({
        configuredRedirect: configuredAuthRedirect,
        currentOrigin: runtimeOrigin,
        allowedOrigins: oauthAllowedOrigins,
        defaultPath: '/login',
        enforceSameOrigin: true,
        productionRuntime: APP_MODE === 'PROD',
    });
    return result.redirectUrl;
};

export const validateOAuthRuntimeConfig = (): { ok: boolean; issues: string[] } => {
    const issues: string[] = [];
    const policy = resolveOAuthRedirectPolicy({
        configuredRedirect: configuredAuthRedirect,
        currentOrigin: runtimeOrigin,
        allowedOrigins: oauthAllowedOrigins,
        defaultPath: '/login',
        enforceSameOrigin: true,
        productionRuntime: APP_MODE === 'PROD',
    });
    issues.push(...policy.issues);

    if (APP_MODE === 'PROD') {
        if (!supabaseUrl) issues.push('VITE_SUPABASE_URL é obrigatória em PROD.');
        if (!supabaseAnonKey) issues.push('VITE_SUPABASE_ANON_KEY é obrigatória em PROD.');
        if (!configuredAuthRedirect) {
            issues.push('VITE_SUPABASE_AUTH_REDIRECT_URL é obrigatória em PROD.');
        }
        if (oauthAllowedOrigins.length === 0) {
            issues.push('VITE_OAUTH_ALLOWED_ORIGINS deve listar origens permitidas em PROD.');
        }
    }

    return { ok: issues.length === 0, issues };
};

// Cria o cliente apenas se configurado, senão cria um cliente dummy
let client;
try {
    // Usar a URL configurada ou um valor padrão seguro que não cause DNS NXDOMAIN imediato se possível, 
    // mas o ideal é que VITE_SUPABASE_URL esteja presente para produção.
    const finalUrl = supabaseUrl || 'https://viva360-mock.supabase.co';
    const finalKey = supabaseAnonKey || 'dummy-anon-key';
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("⚠️ Viva360: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados! Operação real ficará indisponível.");
    }
    client = createClient(finalUrl, finalKey);
} catch (error) {
    console.error("Erro ao inicializar Supabase (Non-blocking):", error);
    // Return a basic client structure to prevent crashes
    client = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async () => ({ data: {}, error: new Error('Supabase not configured') }),
        }
    } as any;
}

export const supabase = client;

// Mock warning removed
