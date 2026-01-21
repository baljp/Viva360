import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { emailService } from '../services/email.service';

// Register
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name, role, ...additionalData } = req.body;

  // Validate input
  if (!email || !password || !name || !role) {
    throw new AppError('Email, senha, nome e tipo de perfil são obrigatórios', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email já cadastrado', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      avatar: `https://api.dicebear.com/7.x/${role === 'SPACE' ? 'identicon' : 'notionists'}/svg?seed=${name}`,
      ...additionalData,
    },
  });

  // If professional, create professional record
  if (role === 'PROFESSIONAL' && req.body.specialty) {
    await prisma.professional.create({
      data: {
        userId: user.id,
        specialty: req.body.specialty || [],
        pricePerSession: req.body.pricePerSession || 100,
        location: req.body.location,
        licenseNumber: req.body.licenseNumber,
      },
    });
  }

  // If space, create space record
  if (role === 'SPACE') {
    await prisma.space.create({
      data: {
        userId: user.id,
        spaceName: req.body.spaceName || name,
        address: req.body.address,
        city: req.body.city,
        capacity: req.body.capacity || 10,
      },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Send Welcome Email
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1>Bem-vindo ao Viva360, ${name}! 🌿</h1>
      <p>Estamos muito felizes em tê-lo em nossa comunidade.</p>
      <p>Explore jornadas, conecte-se com guardiões e cultive seu bem-estar.</p>
      <br/>
      <p>Com carinho,</p>
      <p>Equipe Viva360</p>
    </div>
  `;
  
  // Fire and forget email
  emailService.sendEmail(email, 'Bem-vindo ao Viva360!', welcomeHtml).catch(console.error);

  res.status(201).json({
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  });
});

// Login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      professional: true,
      space: true,
    }
  });

  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  });
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
