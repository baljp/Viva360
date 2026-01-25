import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        // 1. Check if user exists (silently return success to prevent enumeration if desired, OR return error if open)
        // For UX we usually check.
        const user = await AuthService.findByEmail(email);
        if (!user) {
            // Fake success for security or explicit error? 
            // Let's go with explicit error for this project (UX focus)
            return res.status(404).json({ error: "E-mail não encontrado no fluxo." });
        }

        // 2. Generate Recovery Token (JWT valid for 1h)
        const token = jwt.sign({ email, purpose: 'recovery' }, JWT_SECRET, { expiresIn: '1h' });

        // 3. Send Email
        // Assuming client URL is implicit or env var
        const link = `http://localhost:3000/reset-password?token=${token}`; // Should use Frontend URL Env Var
        
        emailService.send({
            to: email,
            subject: 'Recupere seu Acesso ao Santuário 🗝️',
            template: 'RECOVERY',
            context: { link, name: user.email } // Using email as name fallback
        }).catch(console.error);

        return res.json({ message: "Elo de recuperação enviado para seu e-mail." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ error: "Erro ao gerar elo de recuperação." });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) return res.status(400).json({ error: "Dados incompletos." });

        // 1. Verify Token
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.purpose !== 'recovery') return res.status(401).json({ error: "Token inválido." });

        // 2. Update Password
        await AuthService.updatePassword(decoded.email, newPassword);

        return res.json({ message: "Senha renovada com harmonia." });

    } catch (error) {
        return res.status(401).json({ error: "O elo de recuperação expirou ou é inválido." });
    }
};
