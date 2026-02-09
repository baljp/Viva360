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
exports.precheckLogin = exports.register = exports.login = void 0;
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../services/auth.service");
const supabase_service_1 = require("../services/supabase.service");
const async_middleware_1 = require("../middleware/async.middleware");
const secrets_1 = require("../lib/secrets");
const MOCK_TEST_PASSWORD = '123456';
const STRICT_MOCK_TEST_USERS = {
    'client0@viva360.com': { id: 'client_0', role: 'CLIENT', name: 'Buscador Teste' },
    'pro0@viva360.com': { id: 'pro_0', role: 'PROFESSIONAL', name: 'Guardião Teste' },
    'contato.hub0@viva360.com': { id: 'hub_0', role: 'SPACE', name: 'Santuário Teste' },
    'admin@viva360.com': { id: 'admin-001', role: 'ADMIN', name: 'Admin Viva360' },
};
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const precheckSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
});
exports.login = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    if ((0, supabase_service_1.isMockMode)()) {
        const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
        if (!strictUser) {
            return res.status(401).json({ error: 'Conta não autorizada no modo teste.' });
        }
        if (password !== MOCK_TEST_PASSWORD) {
            return res.status(401).json({ error: 'Senha inválida para conta de teste.' });
        }
        const userPayload = { id: strictUser.id, email: normalizedEmail, role: strictUser.role };
        const token = jsonwebtoken_1.default.sign({ userId: userPayload.id, email: userPayload.email, role: userPayload.role }, secrets_1.JWT_SECRET, { expiresIn: '1h' });
        return res.json({
            user: userPayload,
            session: { access_token: token, refresh_token: 'mock-refresh' }
        });
    }
    const canLogin = await auth_service_1.AuthService.canLoginWithEmail(normalizedEmail);
    if (!canLogin) {
        return res.status(401).json({ error: 'Conta não autorizada. Faça cadastro antes de entrar.' });
    }
    const data = await auth_service_1.AuthService.login(email, password);
    return res.json(data);
});
exports.register = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password, name, role } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    if ((0, supabase_service_1.isMockMode)()) {
        return res.status(403).json({
            error: 'Cadastro real desabilitado no modo teste. Use as contas pré-definidas.'
        });
    }
    if (STRICT_MOCK_TEST_USERS[normalizedEmail]) {
        return res.status(400).json({
            error: 'Este e-mail é reservado para ambiente de testes.'
        });
    }
    const data = await auth_service_1.AuthService.register(normalizedEmail, password, name, role); // Pass role
    // Trigger Holistic Welcome Email (Async - Fire & Forget)
    Promise.resolve().then(() => __importStar(require('../services/email.service'))).then(({ emailService }) => {
        emailService.send({
            to: normalizedEmail,
            subject: 'Bem-vindo ao Viva360 - Sua Jornada Começa Agora 🌿',
            template: 'WELCOME',
            context: { name }
        }).catch(err => console.error("Email Error:", err));
    });
    return res.status(201).json(data);
});
exports.precheckLogin = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { email } = precheckSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    if ((0, supabase_service_1.isMockMode)()) {
        const strictUser = STRICT_MOCK_TEST_USERS[normalizedEmail];
        return res.json({ allowed: !!strictUser, role: strictUser?.role || null });
    }
    const profile = await auth_service_1.AuthService.getAuthorizedProfileByEmail(normalizedEmail);
    return res.json({
        allowed: !!profile,
        role: profile?.role ? String(profile.role).toUpperCase() : null,
    });
});
