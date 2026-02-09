import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    description: z.string().min(3),
    receiverId: z.string().min(1).optional(), // Can be UUID (real) or semantic id (mock)
    contextType: z.enum(['BAZAR', 'TRIBO', 'RECRUTAMENTO', 'ESCAMBO', 'AGENDA', 'GERAL']).optional(),
    items: z.array(z.object({
      id: z.string(),
      price: z.number().nonnegative().optional(),
      type: z.string().optional(),
    })).optional(),
  })
});
