"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
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
        const data = await auth_service_1.AuthService.login(email, password);
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
        const data = await auth_service_1.AuthService.register(email, password, name, role); // Pass role
        return res.status(201).json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Registration failed' });
    }
};
exports.register = register;
