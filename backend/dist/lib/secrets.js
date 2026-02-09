"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
const crypto_1 = __importDefault(require("crypto"));
const rawJwtSecret = (process.env.JWT_SECRET || '').trim();
const isProd = process.env.NODE_ENV === 'production';
let resolvedJwtSecret = rawJwtSecret;
if (!resolvedJwtSecret) {
    // Generate ephemeral secret but log severe warning
    resolvedJwtSecret = crypto_1.default.randomBytes(32).toString('hex');
    if (isProd) {
        console.error('🚨 CRITICAL: JWT_SECRET is not set in production! Using ephemeral secret - all sessions will invalidate on function restart.');
    }
    else {
        console.warn('⚠️  JWT_SECRET missing. Using ephemeral secret for non-production.');
    }
}
exports.JWT_SECRET = resolvedJwtSecret;
