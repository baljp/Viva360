"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../lib/secrets");
const supabase_service_1 = require("./supabase.service");
class AuthService {
    // Register new user (creates Auth User + Profile via Trigger or manual)
    static async register(email, password, name, role = 'CLIENT') {
        // Check if user exists
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing)
            throw new Error('User already exists');
        const hashedPassword = (await bcryptjs_1.default.hash(password, 10)).replace(/^\$2b\$/, '$2a$');
        // 1. Create User via Supabase SDK (Safe & Handles Identities/Triggers)
        const { data: authData, error: authError } = await supabase_service_1.supabaseAdmin.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role
                }
            }
        });
        if (authError)
            throw authError;
        if (!authData.user)
            throw new Error('Failed to create auth user');
        const userId = authData.user.id;
        // 2. Create Profile in Prisma (linked to Auth User)
        const profile = await prisma_1.default.profile.create({
            data: {
                id: userId,
                email: email,
                name: name,
                role: role,
                avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
                personal_balance: 1000,
                multiplier: 1,
            }
        });
        // Handle manual hash update if needed (Supabase SDK doesn't allow setting encrypted_password directly, 
        // but it hashes it correctly. We only need the prefix fix if we were inserting manually. 
        // Since we use signUp, it's already correct).
        return AuthService.generateSession({ id: userId, email, role: profile.role });
    }
    // Login
    static async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
            include: { profile: true },
        });
        if (!user || !user.encrypted_password) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.encrypted_password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        return AuthService.generateSession(user);
    }
    // Helper: Generate Session Response
    static generateSession(user) {
        const role = String(user.role || user.profile?.role || 'CLIENT').toUpperCase();
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role
        }, secrets_1.JWT_SECRET, { expiresIn: '1h' });
        return {
            user: {
                id: user.id,
                email: user.email,
                role,
            },
            session: {
                access_token: token,
                refresh_token: 'mock-refresh-token', // Not implementing refresh flow heavily for stress test
            }
        };
    }
    // Update Password
    static async updatePassword(email, newPassword) {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        return prisma_1.default.user.update({
            where: { email },
            data: { encrypted_password: hashedPassword }
        });
    }
    static async findByEmail(email) {
        return prisma_1.default.user.findUnique({ where: { email } });
    }
    static async getAuthorizedProfileByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        return prisma_1.default.profile.findFirst({
            where: { email: normalizedEmail },
            select: { id: true, email: true, name: true, role: true },
        });
    }
    static async canLoginWithEmail(email) {
        const profile = await AuthService.getAuthorizedProfileByEmail(email);
        return !!profile;
    }
}
exports.AuthService = AuthService;
