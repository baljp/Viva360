"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// In Vercel, env vars are injected automatically, so only load .env for local dev
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
    // Try multiple paths for .env (handles different execution contexts)
    const paths = [
        path_1.default.resolve(__dirname, '../../.env'),
        path_1.default.resolve(process.cwd(), '.env'),
        path_1.default.resolve(process.cwd(), 'backend/.env'),
    ];
    for (const envPath of paths) {
        const result = dotenv_1.default.config({ path: envPath });
        if (!result.error) {
            console.log(`🌍 [ENV] Loaded from ${envPath}`);
            break;
        }
    }
}
console.log(`🌍 [ENV] APP_MODE: ${process.env.APP_MODE || 'PROD'}, VERCEL: ${!!process.env.VERCEL}`);
