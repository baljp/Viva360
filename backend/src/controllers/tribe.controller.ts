import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { tribeService } from '../services/tribe.service';
import { z } from 'zod';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { supabaseAdmin } from '../services/supabase.service';

const inviteSchema = z.object({
  email: z.string().email(),
  inviteType: z.enum(['TEAM', 'COMMUNITY', 'JOB']).optional(),
  targetRole: z.enum(['CLIENT', 'PROFESSIONAL', 'SPACE']).optional(),
  contextRef: z.string().min(1).optional(),
  expiresInHours: z.number().int().min(1).max(720).optional(),
});

const inviteResponseSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT']),
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const hubId = req.user?.userId;
  const payload = inviteSchema.parse(req.body || {});
  const expiresAt = payload.expiresInHours
    ? new Date(Date.now() + payload.expiresInHours * 60 * 60 * 1000)
    : null;

  try {
      const invite = await tribeService.inviteMember(hubId, payload.email, {
          inviteType: payload.inviteType,
          targetRole: payload.targetRole,
          contextRef: payload.contextRef || null,
          expiresAt,
      });
      const actionReceipt = await interactionReceiptService.upsert({
        entityType: 'TRIBE_INVITE',
        entityId: invite.id,
        action: 'CREATE',
        actorId: hubId,
        status: 'COMPLETED',
        nextStep: 'TARGET_RESPONSE',
        requestId: req.requestId,
        payload: {
          inviteType: invite.invite_type,
          targetRole: invite.target_role,
          email: invite.email,
        },
      });
      return res.status(201).json({
        code: 'TRIBE_INVITE_CREATED',
        invite,
        actionReceipt,
      });
  } catch (error: any) {
      if (error.message === 'Only Sanctuaries can invite team members') {
          return res.status(403).json({ error: error.message });
      }
      throw error;
  }
});

export const listInvites = asyncHandler(async (req: Request, res: Response) => {
  const hubId = req.user?.userId;
  
  const invites = await tribeService.listInvites(hubId);
  return res.json(invites);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const hubId = req.user?.userId;

  const members = await tribeService.listMembers(hubId);
  return res.json(members);
});

export const joinTribe = asyncHandler(async (req: Request, res: Response) => {
    const { vacancyId } = req.body;
    const proId = req.user?.userId;

    const result = await tribeService.joinTribe(proId, vacancyId);
    return res.json(result);
});

export const syncVibration = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId || req.user?.id;
    const { reward = 10 } = req.body || {};

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update Profile Karma
    const { data: user, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('karma')
        .eq('id', userId)
        .single();

    if (fetchError || !user) {
        return res.status(404).json({ error: 'User profile not found' });
    }

    const newKarma = (user.karma || 0) + Number(reward);

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ karma: newKarma })
        .eq('id', userId);

    if (updateError) {
        throw new Error(`Failed to sync vibration: ${updateError.message}`);
    }

    return res.json({
        success: true,
        reward: Number(reward),
        syncedAt: new Date().toISOString(),
        userId,
        karma: newKarma
    });
});

export const respondInvite = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { decision } = inviteResponseSchema.parse(req.body || {});
  const actorId = String(req.user?.userId || '').trim();
  const actorEmail = String(req.user?.email || '').trim().toLowerCase();

  const invite = await tribeService.respondInvite(id, decision, actorEmail);
  const actionReceipt = await interactionReceiptService.upsert({
    entityType: 'TRIBE_INVITE',
    entityId: String(invite.id),
    action: 'RESPOND',
    actorId,
    status: 'COMPLETED',
    nextStep: decision === 'ACCEPT' ? 'ONBOARD' : 'CLOSED',
    requestId: req.requestId,
    payload: {
      decision,
      status: invite.status,
    },
  });

  return res.json({
    code: decision === 'ACCEPT' ? 'TRIBE_INVITE_ACCEPTED' : 'TRIBE_INVITE_REJECTED',
    invite,
    actionReceipt,
  });
});
