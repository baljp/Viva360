import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { emailService } from '../services/email.service';
import { queueEmail } from '../config/queue';
import { authService } from '../services/auth.service';

// Register
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

// Login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

// Refresh Token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token é obrigatório', 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    throw new AppError('Refresh token inválido ou expirado', 401);
  }
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      professional: true,
      space: {
        include: {
          rooms: true,
          team: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json(userWithoutPassword);
});

// Logout (client-side handles token removal, but we can add to blacklist if needed)
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a more complex setup, add token to blacklist here
  res.json({ message: 'Logout realizado com sucesso' });
});

// Forgot Password - Request reset token
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email é obrigatório', 400);
  }

  // Delegate to service
  await authService.requestPasswordReset(email);

  // Always return success message for security (prevent email enumeration)
  res.json({ message: 'Se o email existir, você receberá um link de recuperação.' });
});

// Reset Password - Verify token and set new password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, code, newPassword } = req.body;
  await authService.resetPassword(email, code, newPassword);
  res.json({ message: 'Senha alterada com sucesso!' });
});
