
import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente com segurança
const env = (import.meta as any).env || {};

export const APP_MODE = env.VITE_APP_MODE || (env.VITE_SUPABASE_URL ? 'PROD' : 'MOCK');

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Export flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = APP_MODE === 'MOCK' || APP_MODE === 'DEMO' || !supabaseUrl;
export const isDemoMode = APP_MODE === 'DEMO';

// Cria o cliente apenas se configurado, senão cria um cliente dummy
// Usamos try/catch para garantir que o createClient não quebre a aplicação se a URL for inválida
let client;
try {
    client = !isMockMode 
        ? createClient(supabaseUrl, supabaseAnonKey)
        : createClient('https://mock.supabase.co', 'mock-key-for-demo-mode-only');
} catch (error) {
    console.error("Erro ao inicializar Supabase, forçando modo demo:", error);
    client = createClient('https://mock.supabase.co', 'mock-key-fallback');
}

export const supabase = client;

if (isMockMode) {
    console.warn("⚠️ Viva360: Rodando em MODO DEMONSTRAÇÃO (Dados locais).");
}
