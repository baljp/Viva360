import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    description: z.string().min(3),
    receiverId: z.string().uuid().optional(), // Optional for some flows
  })
});
