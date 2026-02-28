import { z } from 'zod';

export const CheckInSchema = z.object({
    mood: z.string().min(1, 'Mood is required'),
    photoHash: z.string().optional(),
    photoThumb: z.string().optional(),
    hash: z.string().optional(), // backward compatibility
    thumb: z.string().optional(), // backward compatibility
});

export type CheckInInput = z.infer<typeof CheckInSchema>;
