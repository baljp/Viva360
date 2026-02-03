
import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente com segurança
const env = (import.meta as any).env || {};

export const APP_MODE = env.VITE_APP_MODE || (env.VITE_SUPABASE_URL ? 'PROD' : 'MOCK');

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Export flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = false;
export const isDemoMode = false;

// Cria o cliente apenas se configurado, senão cria um cliente dummy
let client;
try {
    const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
    const finalKey = supabaseAnonKey || 'dummy-anon-key';
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("⚠️ Viva360: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados! Usando placeholders para evitar travamento.");
    }
    client = createClient(finalUrl, finalKey);
} catch (error) {
    console.error("Erro ao inicializar Supabase (Non-blocking):", error);
    // Return a proxy or basic object to prevent app-wide crash
    client = {} as any;
}

export const supabase = client;

// Mock warning removed
