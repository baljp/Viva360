
import { createClient } from '@supabase/supabase-js';
import { parseAllowedOriginPatterns, parseAllowedOrigins, resolveOAuthRedirectPolicy } from './oauthRedirectPolicy';
import { captureFrontendError, captureFrontendMessage } from './frontendLogger';

// Tenta pegar das variáveis de ambiente com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appMode = import.meta.env.VITE_APP_MODE;
const configuredAuthRedirect = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL;
const oauthAllowedOriginsRaw = import.meta.env.VITE_OAUTH_ALLOWED_ORIGINS;
const oauthAllowedOriginPatternsRaw = import.meta.env.VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS;
const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL;
const authConfigVersion = import.meta.env.VITE_AUTH_CONFIG_VERSION;
const isTest = import.meta.env.MODE === 'test';
const isProdBuild = import.meta.env.PROD || import.meta.env.MODE === 'production';
const explicitTestMode = String(import.meta.env.VITE_ENABLE_TEST_MODE || '').toLowerCase() === 'true';
// DATA-01: Unified mock flag — single source of truth for mock eligibility.
const mockEnabledFlag = String(import.meta.env.VITE_MOCK_ENABLED || '').trim().toLowerCase() === 'true';
const testModeEnabled = !isProdBuild && (mockEnabledFlag || explicitTestMode || isTest);
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
const oauthAllowedOriginPatterns = parseAllowedOriginPatterns(oauthAllowedOriginPatternsRaw);

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
// DATA-01: isMockMode now requires the unified MOCK_ENABLED flag to be set.
export const isMockMode = APP_MODE === 'MOCK' && isLocalHostRuntime() && TEST_MODE_ENABLED && mockEnabledFlag;
export const isDemoMode = APP_MODE === 'DEMO';

// Diagnóstico para o Frontend verificar o que foi injetado pelo Vite
export const envStatus = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    hasOAuthAllowlist: oauthAllowedOrigins.length > 0,
    hasOAuthWildcardAllowlist: oauthAllowedOriginPatterns.length > 0,
    mode: APP_MODE,
    testModeEnabled: TEST_MODE_ENABLED,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'undefined',
    authConfigVersion: authConfigVersion || 'unset',
};

export const getOAuthRedirectUrl = (): string => {
    if (APP_MODE === 'MOCK') {
        return `${runtimeOrigin}/login`;
    }

    const result = resolveOAuthRedirectPolicy({
        configuredRedirect: configuredAuthRedirect,
        currentOrigin: runtimeOrigin,
        allowedOrigins: oauthAllowedOrigins,
        allowedOriginPatterns: oauthAllowedOriginPatterns,
        defaultPath: '/login',
        // In Vercel preview deployments, the runtime origin changes per deploy and is
        // typically not allowlisted in Supabase. In production runtime, prefer the
        // configured redirect URL (stable domain) even when origins differ.
        enforceSameOrigin: APP_MODE !== 'PROD',
        productionRuntime: APP_MODE === 'PROD',
        preferRuntimeOriginWhenAllowed: true,
    });
    return result.redirectUrl;
};

export const validateOAuthRuntimeConfig = (): { ok: boolean; issues: string[] } => {
    const issues: string[] = [];
    const policy = resolveOAuthRedirectPolicy({
        configuredRedirect: configuredAuthRedirect,
        currentOrigin: runtimeOrigin,
        allowedOrigins: oauthAllowedOrigins,
        allowedOriginPatterns: oauthAllowedOriginPatterns,
        defaultPath: '/login',
        enforceSameOrigin: APP_MODE !== 'PROD',
        productionRuntime: APP_MODE === 'PROD',
        preferRuntimeOriginWhenAllowed: true,
    });
    issues.push(...policy.issues);

    if (APP_MODE === 'PROD') {
        if (!supabaseUrl) issues.push('VITE_SUPABASE_URL é obrigatória em PROD.');
        if (!supabaseAnonKey) issues.push('VITE_SUPABASE_ANON_KEY é obrigatória em PROD.');
        if (!configuredAuthRedirect) {
            issues.push('VITE_SUPABASE_AUTH_REDIRECT_URL é obrigatória em PROD.');
        }
        if (oauthAllowedOrigins.length === 0) {
            if (oauthAllowedOriginPatterns.length === 0) {
                issues.push('VITE_OAUTH_ALLOWED_ORIGINS ou VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS deve listar origens permitidas em PROD.');
            }
        }
    }

    if (publicAppUrl) {
        try {
            const publicOrigin = new URL(publicAppUrl).origin;
            if (configuredAuthRedirect) {
                const redirectOrigin = new URL(configuredAuthRedirect).origin;
                if (redirectOrigin !== publicOrigin) {
                    issues.push(`VITE_PUBLIC_APP_URL (${publicOrigin}) e VITE_SUPABASE_AUTH_REDIRECT_URL (${redirectOrigin}) divergem.`);
                }
            }
        } catch {
            issues.push('VITE_PUBLIC_APP_URL inválida.');
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
        captureFrontendMessage('supabase.config.missing', {
            domain: 'supabase',
            op: 'bootstrap',
            hasUrl: Boolean(supabaseUrl),
            hasKey: Boolean(supabaseAnonKey),
        });
    }
    client = createClient(finalUrl, finalKey);
} catch (error) {
    captureFrontendError(error, { domain: 'supabase', op: 'bootstrap.createClient' });
    client = createClient('https://viva360-mock.supabase.co', 'dummy-anon-key');
}

export const supabase = client;

if (typeof window !== 'undefined') {
    const diagnostics = validateOAuthRuntimeConfig();
    const runtimeFingerprint = {
        vercelEnv: String(import.meta.env.VERCEL_ENV || '').trim() || 'unknown',
        runtimeOrigin,
        redirect: (() => {
            try { return new URL(getOAuthRedirectUrl()).origin; } catch { return 'invalid'; }
        })(),
        supabaseHost: (() => {
            try { return supabaseUrl ? new URL(supabaseUrl).host : 'unset'; } catch { return 'invalid'; }
        })(),
        authConfigVersion: authConfigVersion || 'unset',
        publicAppUrl: publicAppUrl || 'unset',
    };
    if (!diagnostics.ok) {
        captureFrontendMessage('auth.config.runtime_issues', {
            ...runtimeFingerprint,
            issues: diagnostics.issues,
        });
    }
}

// Mock warning removed
