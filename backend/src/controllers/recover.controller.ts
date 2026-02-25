import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '../lib/secrets';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

type RecoveryTokenPayload = jwt.JwtPayload & {
    email?: string;
    purpose?: string;
    uid?: string;
    jti?: string;
};

const RECOVERY_TOKEN_USED_EVENT = 'PASSWORD_RECOVERY_TOKEN_USED';

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const tokenHashToDeterministicUuid = (token: string) => {
    const chars = sha256(token).slice(0, 32).split('');
    chars[12] = '4';
    chars[16] = ((parseInt(chars[16] || '0', 16) & 0x3) | 0x8).toString(16);
    return `${chars.slice(0, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}-${chars.slice(16, 20).join('')}-${chars.slice(20, 32).join('')}`;
};


export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    // 1. Check if user exists
    const user = await AuthService.findByEmail(email);
    if (!user) {
        return res.status(404).json({ error: "E-mail não encontrado no fluxo." });
    }

    // 2. Generate Recovery Token (JWT valid for 1h)
    const token = jwt.sign(
        {
            email,
            uid: user.id,
            purpose: 'recovery',
            jti: crypto.randomUUID(),
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 3. Send Email — use production frontend URL
    const frontendUrl = (process.env.VITE_SUPABASE_AUTH_REDIRECT_URL || process.env.FRONTEND_URL || 'https://viva360.vercel.app/login').replace(/\/login\/?$/, '');
    const link = `${frontendUrl}/reset-password?token=${token}`;
    
    emailService.send({
        to: email,
        subject: 'Recupere seu Acesso ao Santuário 🗝️',
        template: 'RECOVERY',
        context: { link, name: user.email } // Using email as name fallback
    }).catch((err) => logger.warn('email.recovery_send_failed', err));

    return res.json({ message: "Elo de recuperação enviado para seu e-mail." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) return res.status(400).json({ error: "Dados incompletos." });

    // 1. Verify Token
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as RecoveryTokenPayload;
        if (decoded.purpose !== 'recovery') return res.status(401).json({ error: "Token inválido." });
        const email = String(decoded.email || '').trim().toLowerCase();
        if (!email) return res.status(401).json({ error: "Token inválido." });

        const user = await AuthService.findByEmail(email);
        if (!user) return res.status(401).json({ error: "Token inválido." });
        if (decoded.uid && String(decoded.uid) !== String(user.id)) {
            logger.warn('auth.recovery_reset_uid_mismatch', { email, requestId: req.requestId });
            return res.status(401).json({ error: "Token inválido." });
        }

        const tokenHash = sha256(String(token));
        const markerId = tokenHashToDeterministicUuid(String(token));
        const hashedPassword = await bcrypt.hash(String(newPassword), 10);

        await prisma.$transaction(async (tx) => {
            await tx.event.create({
                data: {
                    id: markerId,
                    stream_id: String(user.id),
                    type: RECOVERY_TOKEN_USED_EVENT,
                    payload: {
                        tokenHash,
                        email,
                        usedAt: new Date().toISOString(),
                        source: 'auth.reset-password',
                    },
                },
            });

            await tx.user.update({
                where: { email },
                data: { encrypted_password: hashedPassword },
            });
        });

        return res.json({ message: "Senha renovada com harmonia." });
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            logger.warn('auth.recovery_token_reused', { requestId: req.requestId });
            return res.status(409).json({ error: "Este elo de recuperação já foi utilizado.", code: 'RECOVERY_TOKEN_ALREADY_USED' });
         }
         return res.status(401).json({ error: "O elo de recuperação expirou ou é inválido." });
    }
});
