import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { supabaseAdmin } from '../services/supabase.service';
import { z } from 'zod';

const checkInSchema = z.object({
  reward: z.number().int().min(1).max(500).optional()
});

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  location: z.string().optional(),
  specialty: z.array(z.string()).optional(),
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const parsed = checkInSchema.parse(req.body || {});
    const reward = parsed.reward ?? 50;
    const userId = String(req.user?.userId || req.user?.id || '').trim();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized check-in', code: 'UNAUTHORIZED_CHECKIN' });
    }

    // Update User Karma & Last Checkin
    const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = user.last_check_in ? user.last_check_in.split('T')[0] : null;

    if (lastCheckIn === today) {
        return res.status(409).json({
            code: 'CHECKIN_ALREADY_DONE',
            status: 'ALREADY_DONE',
            reward: 0,
            user,
        });
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

    return res.json({
        code: 'CHECKIN_DONE',
        status: 'DONE',
        user: updatedUser,
        reward,
    });
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
