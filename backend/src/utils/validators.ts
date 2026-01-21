import { z } from 'zod';

// --- Auth Schemas ---
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE'], {
    errorMap: () => ({ message: 'Tipo de perfil inválido' }),
  }),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  // Professional-specific
  specialty: z.array(z.string()).optional(),
  pricePerSession: z.number().positive().optional(),
  location: z.string().optional(),
  licenseNumber: z.string().optional(),
  // Space-specific
  spaceName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// --- User Schemas ---
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  intention: z.string().max(200).optional(),
});

// --- Appointment Schemas ---
export const createAppointmentSchema = z.object({
  professionalId: z.string().cuid('ID do profissional inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:MM)'),
  serviceName: z.string().min(1, 'Nome do serviço é obrigatório'),
  duration: z.number().int().positive().default(60),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().max(1000).optional(),
});

// --- Product Schemas ---
export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Preço deve ser positivo'),
  image: z.string().url('URL da imagem inválida').optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL_CONTENT']),
  stock: z.number().int().nonnegative().optional(),
});

// --- Notification Schemas ---
export const createNotificationSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['ALERT', 'MESSAGE', 'RITUAL', 'FINANCE', 'APPOINTMENT']).default('ALERT'),
});

// --- Space Schemas ---
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Nome da sala é obrigatório'),
  capacity: z.number().int().positive().default(1),
  hourlyRate: z.number().nonnegative().optional(),
});

export const createVacancySchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  specialties: z.array(z.string()).min(1, 'Informe pelo menos uma especialidade'),
});

// --- Pagination Schemas ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const searchProfessionalsSchema = paginationSchema.extend({
  specialty: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  city: z.string().optional(),
  isAvailableForSwap: z.coerce.boolean().optional(),
});

export const searchProductsSchema = paginationSchema.extend({
  category: z.string().optional(),
  type: z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL_CONTENT']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});

// --- Type Exports ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
