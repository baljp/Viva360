import { z } from 'zod';

export const CheckInSchema = z.object({
    mood: z.string().min(1).default('sereno'),  // optional — DailyBlessing omits it
    photoHash: z.string().optional(),
    photoThumb: z.string().optional(),
    hash: z.string().optional(), // backward compatibility
    thumb: z.string().optional(), // backward compatibility
    reward: z.number().optional(), // DailyBlessing passes reward here
});

export type CheckInInput = z.infer<typeof CheckInSchema>;
