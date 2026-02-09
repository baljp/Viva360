
import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appMode = import.meta.env.VITE_APP_MODE;
const configuredAuthRedirect = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL;
const isTest = import.meta.env.MODE === 'test';
const isDevRuntime = !!import.meta.env.DEV;
const explicitTestMode = String(import.meta.env.VITE_ENABLE_TEST_MODE || '').toLowerCase() === 'true';
const testModeEnabled = explicitTestMode || isTest;
const explicitMode = String(appMode || '').toUpperCase();

const resolveAppMode = (): 'PROD' | 'MOCK' | 'DEMO' => {
    if (explicitMode === 'DEMO') return 'DEMO';
    if (explicitMode === 'MOCK') return (testModeEnabled || isDevRuntime) ? 'MOCK' : 'PROD';
    if (explicitMode === 'PROD') return 'PROD';

    if (testModeEnabled) return 'MOCK';
    return 'PROD';
};

// Determina o modo da aplicação
export const APP_MODE = resolveAppMode();
export const TEST_MODE_ENABLED = testModeEnabled;

// Export flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = APP_MODE === 'MOCK' && (TEST_MODE_ENABLED || isDevRuntime);
export const isDemoMode = APP_MODE === 'DEMO';

// Diagnóstico para o Frontend verificar o que foi injetado pelo Vite
export const envStatus = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: APP_MODE,
    testModeEnabled: TEST_MODE_ENABLED,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'undefined'
};

const safeParseUrl = (value?: string): URL | null => {
    if (!value) return null;
    try {
        return new URL(value);
    } catch {
        return null;
    }
};

export const getOAuthRedirectUrl = (): string => {
    const parsedCustom = safeParseUrl(configuredAuthRedirect);
    if (parsedCustom) return parsedCustom.toString();

    if (typeof window !== 'undefined') {
        return `${window.location.origin}/login`;
    }

    return 'http://localhost:5173/login';
};

export const validateOAuthRuntimeConfig = (): { ok: boolean; issues: string[] } => {
    const issues: string[] = [];
    const redirectTo = getOAuthRedirectUrl();
    const parsedRedirect = safeParseUrl(redirectTo);

    if (!parsedRedirect) {
        issues.push('VITE_SUPABASE_AUTH_REDIRECT_URL inválida.');
    } else if (!parsedRedirect.pathname.startsWith('/login')) {
        issues.push('Redirect OAuth deve apontar para /login.');
    }

    if (APP_MODE === 'PROD') {
        if (!supabaseUrl || !supabaseAnonKey) {
            issues.push('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias em PROD.');
        }

        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            const redirectOrigin = parsedRedirect?.origin || '';
            const isLocalhost = currentOrigin.includes('localhost');

            if (!configuredAuthRedirect && !TEST_MODE_ENABLED) {
                issues.push('Defina VITE_SUPABASE_AUTH_REDIRECT_URL para validar OAuth em domínio real.');
            }

            if (!isLocalhost && redirectOrigin && redirectOrigin !== currentOrigin) {
                issues.push(`Origem atual (${currentOrigin}) difere da origem do redirect (${redirectOrigin}).`);
            }
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
