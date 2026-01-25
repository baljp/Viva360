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
            let role = 'CLIENT';
            if (email.includes('pro'))
                role = 'PROFESSIONAL';
            if (email.includes('hub'))
                role = 'SPACE';
            let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
            let name = 'Buscador Demo';
            if (role === 'PROFESSIONAL') {
                name = 'Guardião Demo';
                avatar = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200';
            }
            if (role === 'SPACE') {
                name = 'Santuário Demo';
                avatar = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=200';
            }
            return res.json({
                user: {
                    id: `mock-user-${role.toLowerCase()}`,
                    email,
                    role,
                    name,
                    avatar,
                    karma: 120,
                    streak: 5,
                    multiplier: 1.2,
                    plantStage: 'seed',
                    plantXp: 45,
                    corporateBalance: 0,
                    personalBalance: 500
                },
                session: { access_token: `mock-jwt-token-${role}`, refresh_token: 'mock-refresh-token' },
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
            const mockUser = {
                id: `mock-user-${Date.now()}`,
                email,
                role: role || 'CLIENT',
                name,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name, // Dynamic avatar
                karma: 0,
                streak: 0,
                multiplier: 1.0,
                plantStage: 'seed',
                plantXp: 0,
                corporateBalance: 0,
                personalBalance: 0,
                needs: [],
                offers: [],
                rating: 5,
                swapCredits: 100,
                isAvailableForSwap: true
            };
            return res.json({
                user: mockUser,
                session: { access_token: `mock-register-token-${Date.now()}`, refresh_token: 'mock-refresh-token' },
            });
        }
        // Use Admin API to create user with auto-confirmation
        const { data: userData, error: createError } = await supabase_service_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name,
                role: role || 'CLIENT',
            }
        });
        if (createError)
            throw createError;
        // Immediately sign in to get a session
        const { data: sessionData, error: signInError } = await supabase_service_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (signInError)
            throw signInError;
        return res.json({
            user: userData.user,
            session: sessionData.session
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Registration failed' });
    }
};
exports.register = register;
