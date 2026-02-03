
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
// Usamos try/catch para garantir que o createClient não quebre a aplicação se a URL for inválida
let client;
try {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("❌ Viva360: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados! A aplicação irá falhar.");
    }
    client = createClient(supabaseUrl || '', supabaseAnonKey || '');
} catch (error) {
    console.error("Erro fatal ao inicializar Supabase:", error);
    throw error;
}

export const supabase = client;

// Mock warning removed
