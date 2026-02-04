
import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appMode = import.meta.env.VITE_APP_MODE;
const isTest = import.meta.env.MODE === 'test';

// Determina o modo da aplicação
export const APP_MODE = appMode || (isTest ? 'MOCK' : (supabaseUrl ? 'PROD' : 'MOCK'));

// Export flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = APP_MODE === 'MOCK';
export const isDemoMode = APP_MODE === 'DEMO';

// Cria o cliente apenas se configurado, senão cria um cliente dummy
let client;
try {
    // Usar a URL configurada ou um valor padrão seguro que não cause DNS NXDOMAIN imediato se possível, 
    // mas o ideal é que VITE_SUPABASE_URL esteja presente para produção.
    const finalUrl = supabaseUrl || 'https://viva360-mock.supabase.co';
    const finalKey = supabaseAnonKey || 'dummy-anon-key';
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("⚠️ Viva360: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados! Usando placeholders para evitar travamento.");
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
