import { Request, Response } from 'express';
import { supabaseAdmin, isMockMode } from '../services/supabase.service';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { profileService } from '../services/profile.service';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  specialty: z.array(z.string()).optional(),
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const data = await profileService.getProfile(user);
    return res.json(data);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const updates = updateProfileSchema.parse(req.body);
    const data = await profileService.updateProfile(user, updates);
    return res.json(data);
});

export const listProfiles = asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role as string;
    
    const profiles = await profileService.listProfiles(role);
    return res.json(profiles);
});
