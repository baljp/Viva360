import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    description: z.string().min(3),
    receiverId: z.string().min(1).optional(), // Can be UUID (real) or semantic id (mock)
    paymentMethod: z.enum(['card', 'pix', 'direct']).optional(),
    contextType: z.enum(['BAZAR', 'TRIBO', 'RECRUTAMENTO', 'ESCAMBO', 'AGENDA', 'GERAL']).optional(),
    contextRef: z.string().min(1).optional(),
    items: z.array(z.object({
      id: z.string(),
      price: z.number().nonnegative().optional(),
      type: z.string().optional(),
    })).optional(),
  }).superRefine((value, ctx) => {
    const contextType = String(value.contextType || 'GERAL').toUpperCase();
    if (contextType !== 'BAZAR' && contextType !== 'GERAL' && !String(value.contextRef || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'contextRef é obrigatório para contextos não bazar.',
        path: ['contextRef'],
      });
    }
  })
});
