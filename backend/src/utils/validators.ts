import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
  newPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Perfil inválido (CLIENT, PROFESSIONAL, SPACE)' }) }),
  
  // Professional specific
  specialty: z.array(z.string()).optional(),
  pricePerSession: z.number().min(0).optional(),
  location: z.string().optional(),
  licenseNumber: z.string().optional(),
  
  // Space specific
  spaceName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  capacity: z.number().min(0).optional(),
}).refine((data) => {
  if (data.role === 'PROFESSIONAL' && (!data.specialty || data.specialty.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Especialidade é obrigatória para profissionais",
  path: ["specialty"]
});
