"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
// Validation Schema
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
});
const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({
                user: { id: 'mock-user-id', email, role: 'CLIENT' },
                session: { access_token: 'mock-jwt-token', refresh_token: 'mock-refresh-token' },
            });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(401).json({ error: error.message || 'Authentication failed' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({
                user: { id: 'mock-new-user-id', email, user_metadata: { name, role } },
                session: null, // Usually register requires email confirmation
            });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: role || 'CLIENT',
                },
            },
        });
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Registration failed' });
    }
};
exports.register = register;
