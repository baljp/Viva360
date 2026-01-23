
import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente com segurança
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves são válidas e NÃO são os placeholders do exemplo
const hasValidUrl = supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('seu-projeto');
const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('sua-chave');

const isConfigured = hasValidUrl && hasValidKey;

// Exporta flag para a API saber se deve usar dados reais ou simulados
export const isMockMode = !isConfigured;

// Cria o cliente apenas se configurado, senão cria um cliente dummy
// Usamos try/catch para garantir que o createClient não quebre a aplicação se a URL for inválida
let client;
try {
    client = isConfigured 
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
