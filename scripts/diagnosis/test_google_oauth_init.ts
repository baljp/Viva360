
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Try to find the values
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const redirectUrl = process.env.VITE_SUPABASE_AUTH_REDIRECT_URL;

console.log('--- SUPABASE CONFIG DIAGNOSTIC ---');
console.log('URL:', supabaseUrl?.trim());
console.log('Anon Key length:', supabaseAnonKey?.trim().length);
console.log('Redirect URL (Original):', JSON.stringify(redirectUrl));

const supabase = createClient(supabaseUrl?.trim() || '', supabaseAnonKey?.trim() || '');

async function testOAuthInit() {
    console.log('Attempting to generate OAuth URL...');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl?.trim() || 'https://viva360.vercel.app/login',
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
            },
        }
    });

    if (error) {
        console.error('❌ Error generating OAuth URL:', error.message);
    } else {
        console.log('✅ OAuth URL generated successfully!');
        console.log('Redirect Target:', data.url);
        
        // Check for double encoded params or corrupted URLs
        const url = new URL(data.url);
        console.log('Base URL:', url.origin + url.pathname);
        console.log('Redirect URI param:', url.searchParams.get('redirect_uri'));
    }
}

testOAuthInit();
