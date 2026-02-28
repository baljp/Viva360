import { z } from 'zod';

export const CreateEventSchema = z.object({
    title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
    start: z.string().datetime(),
    end: z.string().datetime(),
    type: z.enum(['workshop', 'retreat']),
    details: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, 'Details deve ser um JSON válido'),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
