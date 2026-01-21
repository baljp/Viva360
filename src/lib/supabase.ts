import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente de forma segura
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Previne o erro "supabaseUrl is required" fornecendo valores de fallback
// Se as chaves não existirem, o cliente será criado mas chamadas de API falharão (o que é esperado sem config)
const validUrl = supabaseUrl && supabaseUrl.length > 0 ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey && supabaseAnonKey.length > 0 ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(validUrl, validKey);
