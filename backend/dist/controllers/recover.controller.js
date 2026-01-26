"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = void 0;
const auth_service_1 = require("../services/auth.service");
const email_service_1 = require("../services/email.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // 1. Check if user exists (silently return success to prevent enumeration if desired, OR return error if open)
        // For UX we usually check.
        const user = await auth_service_1.AuthService.findByEmail(email);
        if (!user) {
            // Fake success for security or explicit error? 
            // Let's go with explicit error for this project (UX focus)
            return res.status(404).json({ error: "E-mail não encontrado no fluxo." });
        }
        // 2. Generate Recovery Token (JWT valid for 1h)
        const token = jsonwebtoken_1.default.sign({ email, purpose: 'recovery' }, JWT_SECRET, { expiresIn: '1h' });
        // 3. Send Email
        // Assuming client URL is implicit or env var
        const link = `http://localhost:3000/reset-password?token=${token}`; // Should use Frontend URL Env Var
        email_service_1.emailService.send({
            to: email,
            subject: 'Recupere seu Acesso ao Santuário 🗝️',
            template: 'RECOVERY',
            context: { link, name: user.email } // Using email as name fallback
        }).catch(console.error);
        return res.json({ message: "Elo de recuperação enviado para seu e-mail." });
    }
    catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ error: "Erro ao gerar elo de recuperação." });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ error: "Dados incompletos." });
        // 1. Verify Token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.purpose !== 'recovery')
            return res.status(401).json({ error: "Token inválido." });
        // 2. Update Password
        await auth_service_1.AuthService.updatePassword(decoded.email, newPassword);
        return res.json({ message: "Senha renovada com harmonia." });
    }
    catch (error) {
        return res.status(401).json({ error: "O elo de recuperação expirou ou é inválido." });
    }
};
exports.resetPassword = resetPassword;
