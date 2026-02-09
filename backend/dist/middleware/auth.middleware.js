"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../lib/secrets");
const supabase_service_1 = require("../services/supabase.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const normalizeUserId = (candidate) => {
    if (!candidate)
        return DEFAULT_USER_ID;
    return UUID_REGEX.test(candidate) ? candidate : DEFAULT_USER_ID;
};
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid Authorization header format' });
    }
    // Support for E2E Mock Token in MOCK mode
    if (process.env.APP_MODE === 'MOCK' && token === 'admin-excellence-2026') {
        req.user = { id: DEFAULT_USER_ID, userId: DEFAULT_USER_ID, role: 'ADMIN', email: 'admin@viva360.ai' };
        return next();
    }
    try {
        // Primary path: Supabase Auth token
        const { data, error } = await supabase_service_1.supabaseAdmin.auth.getUser(token);
        if (!error && data.user) {
            const userId = normalizeUserId(data.user.id);
            let role = String(data.user.user_metadata?.role || '').trim().toUpperCase();
            if (!role) {
                try {
                    const profile = await prisma_1.default.profile.findUnique({
                        where: { id: userId },
                        select: { role: true },
                    });
                    role = String(profile?.role || '').trim().toUpperCase() || 'CLIENT';
                }
                catch {
                    role = 'CLIENT';
                }
            }
            req.user = {
                id: userId,
                userId,
                email: data.user.email,
                role,
            };
            return next();
        }
        // Fallback path: internal JWT emitted by /auth/login
        const payload = jsonwebtoken_1.default.verify(token, secrets_1.JWT_SECRET);
        const userId = normalizeUserId(payload?.userId || payload?.id || payload?.sub);
        req.user = {
            id: userId,
            userId,
            email: payload?.email,
            role: payload?.role || 'CLIENT',
        };
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateUser = authenticateUser;
