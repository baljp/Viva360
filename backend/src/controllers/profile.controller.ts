import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async.middleware';
import { profileService } from '../services/profile.service';
import { profileRepository } from '../repositories/profile.repository';

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

const lookupSchema = z.object({
    email: z.string().email(),
});

export const searchProfiles = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const profiles = await profileRepository.searchByName(q);
  const myId = String(req.user?.userId || '');
  type SearchRow = { id: string; name?: string | null; avatar?: string | null; role?: string | null };
  return res.json(
    (profiles as SearchRow[])
      .filter((p) => p.id !== myId) // exclude self
      .slice(0, 20)
      .map((p) => ({
        id: p.id,
        name: p.name || 'Usuário',
        avatar: p.avatar,
        role: p.role,
      }))
  );
});

export const lookupProfile = asyncHandler(async (req: Request, res: Response) => {
    const requesterRole = String(req.user?.role || '').toUpperCase();
    // Prevent email enumeration for regular users.
    if (!['PROFESSIONAL', 'ADMIN'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { email } = lookupSchema.parse(req.query || {});
    const profile = await profileService.lookupByEmail(email);
    if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    type ProfileRow = { id: string; name?: string | null; email?: string | null; role?: string | null; active_role?: string | null; avatar?: string | null };
    const p = profile as ProfileRow;
    const role = String(p.active_role || p.role || '').toUpperCase();
    // For Guardian -> Buscador internal linking, we only allow looking up Buscadores here.
    if (role !== 'CLIENT') {
        return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        avatar: p.avatar,
    });
});
