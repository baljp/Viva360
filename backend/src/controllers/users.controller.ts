import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';

const checkInSchema = z.object({
  userId: z.string(),
  reward: z.number().min(1).default(50)
});

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  location: z.string().optional(),
  specialty: z.array(z.string()).optional(),
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const { userId, reward } = checkInSchema.parse(req.body);

    // Validate user match
    if (req.user?.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized check-in' });
    }

    // Update User Karma & Last Checkin
    const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = user.last_check_in ? user.last_check_in.split('T')[0] : null;

    if (lastCheckIn === today) {
        return res.json({ user, reward: 0, message: 'Already checked in today' });
    }

    // Apply Reward
    const updates = {
        karma: (user.karma || 0) + reward,
        last_check_in: new Date().toISOString(),
        streak: (user.streak || 0) + 1
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (updateError) {
        throw new Error('Failed to update user check-in');
    }

    return res.json({ user: updatedUser, reward });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
    }

    return res.json(data);
});

export const updateById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsed = userUpdateSchema.safeParse(req.body || {});

    const updates = parsed.success
        ? parsed.data
        : {
            name: req.body?.name,
            bio: req.body?.bio,
            avatar: req.body?.avatar,
            location: req.body?.location,
            specialty: Array.isArray(req.body?.specialty) ? req.body.specialty : undefined,
        };

    const sanitized = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitized).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(sanitized)
        .eq('id', id)
        .select('*')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found or update failed' });
    }

    return res.json(data);
});
