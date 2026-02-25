import { Request, Response } from 'express';
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

const lookupSchema = z.object({
    email: z.string().email(),
});

export const searchProfiles = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json([]);

  const profiles = await profileRepository.searchByName(q);
  const myId = String(req.user?.userId || '');
  return res.json(
    profiles
      .filter((p: any) => p.id !== myId) // exclude self
      .slice(0, 20)
      .map((p: any) => ({
        id: p.id,
        name: p.name || 'Usuário',
        avatar: p.avatar,
        role: p.role,
      }))
  );
});

export const lookupProfile = asyncHandler(async (req: any, res: Response) => {
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

    const role = String((profile as any).active_role || (profile as any).role || '').toUpperCase();
    // For Guardian -> Buscador internal linking, we only allow looking up Buscadores here.
    if (role !== 'CLIENT') {
        return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
        id: (profile as any).id,
        name: (profile as any).name,
        email: (profile as any).email,
        role: (profile as any).role,
        avatar: (profile as any).avatar,
    });
});
