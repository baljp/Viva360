import { Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { asyncHandler } from '../middleware/async.middleware';
import prisma from '../lib/prisma';
import { profileLinkService } from '../services/profileLink.service';

type InviteKind = 'tribo' | 'guardian' | 'space';
type TargetRole = 'CLIENT' | 'PROFESSIONAL' | 'SPACE';
type ProfileLinkKind = 'tribo' | 'paciente';
type InviteTokenPayload = JwtPayload & {
  purpose: 'invite';
  inviterId: string;
  kind?: InviteKind;
  targetRole?: TargetRole;
  contextRef?: string;
};

const getSecret = () => {
  return process.env.INVITE_JWT_SECRET || process.env.JWT_SECRET || '';
};

const getBaseUrl = (req: Request) => {
  const origin = String(req.get('origin') || '').trim();
  if (origin) return origin;
  const host = String(req.get('host') || '').trim();
  if (!host) return 'https://viva360.vercel.app';
  const proto = String((req.headers['x-forwarded-proto'] as string) || req.protocol || 'https');
  return `${proto}://${host}`;
};

const normalizeKind = (input: unknown): InviteKind => {
  const v = String(input || '').toLowerCase();
  if (v === 'guardian') return 'guardian';
  if (v === 'space') return 'space';
  return 'tribo';
};

const normalizeTargetRole = (input: unknown): TargetRole | null => {
  const v = String(input || '').toUpperCase();
  if (v === 'CLIENT') return 'CLIENT';
  if (v === 'PROFESSIONAL') return 'PROFESSIONAL';
  if (v === 'SPACE') return 'SPACE';
  return null;
};

const parseInvitePayload = (token: string, secret: string): InviteTokenPayload | null => {
  const payload = jwt.verify(token, secret);
  if (!payload || typeof payload === 'string') return null;
  if (payload.purpose !== 'invite' || !payload.inviterId) return null;
  return payload as InviteTokenPayload;
};

export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const inviterId = (req as any).user?.userId;
  const secret = getSecret();
  if (!secret) return res.status(503).json({ error: 'Invite signing unavailable' });

  const kind = normalizeKind(req.body?.kind);
  const targetRole = normalizeTargetRole(req.body?.targetRole) || 'CLIENT';
  const contextRef = typeof req.body?.contextRef === 'string' ? req.body.contextRef : undefined;

  const expiresInSeconds = 7 * 24 * 60 * 60;
  const token = jwt.sign(
    {
      purpose: 'invite',
      inviterId,
      kind,
      targetRole,
      contextRef,
    },
    secret,
    { expiresIn: expiresInSeconds }
  );

  const url = `${getBaseUrl(req)}/invite/${encodeURIComponent(token)}`;
  return res.json({
    token,
    url,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    kind,
    targetRole,
  });
});

export const resolveInvite = asyncHandler(async (req: Request, res: Response) => {
  const secret = getSecret();
  if (!secret) return res.status(503).json({ error: 'Invite validation unavailable' });

  const token = String(req.params.token || '').trim();
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const payload = parseInvitePayload(token, secret);
    if (!payload) return res.status(400).json({ error: 'invalid token payload' });

    const inviter = await prisma.profile.findUnique({
      where: { id: payload.inviterId },
      select: { id: true, name: true, avatar: true, role: true },
    });

    return res.json({
      ok: true,
      kind: payload.kind,
      targetRole: payload.targetRole,
      contextRef: payload.contextRef || null,
      inviter: inviter
        ? { id: inviter.id, name: inviter.name || 'Viva360', avatar: inviter.avatar || '', role: inviter.role }
        : null,
    });
  } catch {
    return res.status(400).json({ error: 'invalid token' });
  }
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const secret = getSecret();
  if (!secret) return res.status(503).json({ error: 'Invite validation unavailable' });

  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const payload = parseInvitePayload(token, secret);
    if (!payload) return res.status(400).json({ error: 'invalid token payload' });

    if (String(payload.inviterId) === String(userId)) {
      return res.status(400).json({ error: 'cannot accept own invite' });
    }

    const kind: InviteKind = normalizeKind(payload.kind);
    const inviterId = String(payload.inviterId);

    if (kind === 'space') {
      const code = String(payload.contextRef || '').trim();
      if (!code) return res.status(400).json({ error: 'missing space invite code' });

      const invite = await prisma.spaceInvite.findUnique({ where: { code } });
      if (!invite) return res.status(404).json({ error: 'invite code not found' });
      if (invite.status !== 'active') return res.status(400).json({ error: 'invite code inactive' });
      if (invite.expires_at.getTime() <= Date.now()) return res.status(400).json({ error: 'invite code expired' });
      if (invite.space_id !== inviterId) return res.status(400).json({ error: 'invite code mismatch' });

      const nextUsage = invite.usage + 1;
      await prisma.spaceInvite.update({
        where: { code },
        data: {
          usage: nextUsage,
          status: nextUsage >= invite.max_usage ? 'used' : 'active',
        },
      });

      const existing = await prisma.contract.findFirst({
        where: { space_id: invite.space_id, guardian_id: userId, status: { in: ['active', 'pending'] } },
      });
      if (!existing) {
        await prisma.contract.create({
          data: {
            space_id: invite.space_id,
            guardian_id: userId,
            space_name: 'Santuário',
            start_date: new Date(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'active',
            monthly_fee: 0,
            revenue_share: 15,
            rooms_allowed: [],
            hours_per_week: 0,
            benefits: [],
            rules: [],
            terms: null,
            signed: false,
            version: '1.0',
          },
        });
      }

      return res.json({ ok: true, kind, linked: true });
    }

    const linkType: ProfileLinkKind = kind === 'guardian' ? 'paciente' : 'tribo';
    const existingLink = await prisma.profileLink.findFirst({
      where: {
        type: linkType,
        OR: [
          { source_id: inviterId, target_id: userId },
          { source_id: userId, target_id: inviterId },
        ],
      },
    });

    if (existingLink?.status === 'accepted' || existingLink?.status === 'active') {
      return res.json({ ok: true, kind, linked: true, linkId: existingLink.id });
    }

    if (existingLink?.status === 'pending') {
      if (existingLink.target_id === userId) {
        const accepted = await profileLinkService.acceptLink(existingLink.id, userId);
        return res.json({ ok: true, kind, linked: true, linkId: accepted.id });
      }
      return res.json({ ok: true, kind, linked: false, linkId: existingLink.id });
    }

    const created = await profileLinkService.createLink(inviterId, userId, linkType);
    const accepted = await profileLinkService.acceptLink(created.id, userId);
    return res.json({ ok: true, kind, linked: true, linkId: accepted.id });
  } catch {
    return res.status(400).json({ error: 'invalid token' });
  }
});
