import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/async.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    // 1. Check if user exists
    const user = await AuthService.findByEmail(email);
    if (!user) {
        return res.status(404).json({ error: "E-mail não encontrado no fluxo." });
    }

    // 2. Generate Recovery Token (JWT valid for 1h)
    const token = jwt.sign({ email, purpose: 'recovery' }, JWT_SECRET, { expiresIn: '1h' });

    // 3. Send Email
    const link = `http://localhost:3000/reset-password?token=${token}`; // Should use Frontend URL Env Var
    
    emailService.send({
        to: email,
        subject: 'Recupere seu Acesso ao Santuário 🗝️',
        template: 'RECOVERY',
        context: { link, name: user.email } // Using email as name fallback
    }).catch(console.error);

    return res.json({ message: "Elo de recuperação enviado para seu e-mail." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) return res.status(400).json({ error: "Dados incompletos." });

    // 1. Verify Token
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.purpose !== 'recovery') return res.status(401).json({ error: "Token inválido." });

        // 2. Update Password
        await AuthService.updatePassword(decoded.email, newPassword);

        return res.json({ message: "Senha renovada com harmonia." });
    } catch (error) {
         return res.status(401).json({ error: "O elo de recuperação expirou ou é inválido." });
    }
});
