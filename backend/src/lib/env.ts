import dotenv from 'dotenv';
import path from 'path';
import { logger } from './logger';

// In Vercel, env vars are injected automatically, so only load .env for local dev
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (!isServerless) {
    // Try multiple paths for .env (handles different execution contexts)
    const paths = [
        path.resolve(__dirname, '../../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend/.env'),
    ];
    
    for (const envPath of paths) {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
            logger.info('env.loaded', { envPath });
            break;
        }
    }
}

logger.info('env.runtime', { appMode: process.env.APP_MODE || 'PROD', vercel: !!process.env.VERCEL });

const safeOrigin = (value?: string | null): string | null => {
    try {
        const raw = String(value || '').trim();
        if (!raw) return null;
        return new URL(raw).origin;
    } catch {
        return null;
    }
};

const safeHost = (value?: string | null): string | null => {
    try {
        const raw = String(value || '').trim();
        if (!raw) return null;
        return new URL(raw).host;
    } catch {
        return null;
    }
};

const frontendUrl = process.env.FRONTEND_URL || '';
const viteRedirect = process.env.VITE_SUPABASE_AUTH_REDIRECT_URL || '';
const authConfigVersion = process.env.AUTH_CONFIG_VERSION || process.env.VITE_AUTH_CONFIG_VERSION || '';
const runtimeOrigin = safeOrigin(
    process.env.VERCEL_URL ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}` : frontendUrl,
);
const frontendOrigin = safeOrigin(frontendUrl);
const redirectOrigin = safeOrigin(viteRedirect);

const authConfigIssues: string[] = [];
if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) authConfigIssues.push('SUPABASE_URL ausente');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) authConfigIssues.push('SUPABASE_SERVICE_ROLE_KEY ausente');
if (!process.env.VITE_SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY) authConfigIssues.push('SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY ausente');
if (!viteRedirect) authConfigIssues.push('VITE_SUPABASE_AUTH_REDIRECT_URL ausente');
if (!frontendUrl) authConfigIssues.push('FRONTEND_URL ausente');
if (!authConfigVersion) authConfigIssues.push('AUTH_CONFIG_VERSION/VITE_AUTH_CONFIG_VERSION ausente (recomendado para paridade Preview/Prod)');
if (frontendOrigin && redirectOrigin && frontendOrigin !== redirectOrigin) {
    authConfigIssues.push(`FRONTEND_URL (${frontendOrigin}) difere do redirect OAuth (${redirectOrigin})`);
}

logger.info('auth.config.runtime', {
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    vercelUrl: process.env.VERCEL_URL || null,
    runtimeOrigin,
    frontendOrigin,
    redirectOrigin,
    supabaseHost: safeHost(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    authConfigVersion: authConfigVersion || 'unset',
    issues: authConfigIssues,
});

if (authConfigIssues.length > 0) {
    logger.warn('auth.config.runtime_issues', { vercelEnv: process.env.VERCEL_ENV || 'unknown', issues: authConfigIssues });
}
