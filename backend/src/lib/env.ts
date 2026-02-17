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
