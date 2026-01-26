"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../services/auth.service");
const supabase_service_1 = require("../services/supabase.service");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
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
            const token = jsonwebtoken_1.default.sign({ userId: 'mock-user-id', email, role: 'CLIENT' }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({
                user: { id: 'mock-user-id', email },
                session: { access_token: token, refresh_token: 'mock-refresh' }
            });
        }
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
        if ((0, supabase_service_1.isMockMode)()) {
            const token = jsonwebtoken_1.default.sign({ userId: 'mock-user-id', email, role: role || 'CLIENT' }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(201).json({
                user: { id: 'mock-user-id', email, role },
                session: { access_token: token, refresh_token: 'mock-refresh' }
            });
        }
        const data = await auth_service_1.AuthService.register(email, password, name, role); // Pass role
        // Trigger Holistic Welcome Email (Async - Fire & Forget)
        Promise.resolve().then(() => __importStar(require('../services/email.service'))).then(({ emailService }) => {
            emailService.send({
                to: email,
                subject: 'Bem-vindo ao Viva360 - Sua Jornada Começa Agora 🌿',
                template: 'WELCOME',
                context: { name }
            }).catch(err => console.error("Email Error:", err));
        });
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
