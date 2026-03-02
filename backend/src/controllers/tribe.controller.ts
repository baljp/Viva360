import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { tribeService } from '../services/tribe.service';
import { z } from 'zod';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { supabaseAdmin } from '../services/supabase.service';
import { AppError } from '../lib/AppError';
import prisma from '../lib/prisma';
import { isDbUnavailableError } from '../lib/dbReadFallback';
import { isMockMode, mockAdapter } from '../services/mockAdapter';

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

const tribePostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  type: z.enum(['insight', 'question', 'celebration']).default('insight'),
});

const isMissingRelationError = (error: unknown) => {
  const code = String((error as { code?: string } | null)?.code || '');
  const message = String((error as { message?: string } | null)?.message || '');
  return code === '42P01' || code === 'P2021' || code === 'P2022' || /relation .* does not exist/i.test(message);
};

type TribePostWithAuthor = {
  id: string;
  content: string;
  type: string;
  likes_count: number;
  created_at: Date;
  author_id: string;
  author?: { id: string; name: string | null; avatar: string | null; role: string | null } | null;
};

const normalizeTribePost = (row: TribePostWithAuthor) => ({
  id: String(row.id || ''),
  content: String(row.content || ''),
  type: String(row.type || 'insight'),
  likes: Number(row.likes_count || 0),
  created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
  author_id: row.author_id ? String(row.author_id) : null,
  author: row.author ?? null,
});

const tribePostsNotConfigured = (res: Response) =>
  res.status(503).json({
    code: 'TRIBE_POSTS_NOT_CONFIGURED',
    message: 'Tribe posts persistence is not configured in this environment.',
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
      if (isMockMode()) {
        mockAdapter.tribe.invites.set(String(invite.id), {
          id: String(invite.id),
          hub_id: String(invite.hub_id || hubId || ''),
          email: String(invite.email || payload.email),
          status: String(invite.status || 'pending'),
          created_at: new Date().toISOString(),
        });
      }
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
  try {
    const invites = await tribeService.listInvites(hubId);
    return res.json(invites);
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const fallback = [...mockAdapter.tribe.invites.values()].filter((invite) => String(invite.hub_id) === String(hubId || ''));
      return res.json(fallback);
    }
    throw error;
  }
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const hubId = req.user?.userId;
  try {
    const members = await tribeService.listMembers(hubId);
    return res.json(members);
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const fallback = [...mockAdapter.tribe.members.values()].filter((member) => String(member.hub_id) === String(hubId || ''));
      return res.json(fallback);
    }
    throw error;
  }
});

export const listPosts = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.tribePost.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
    return res.json(posts.map((row) => normalizeTribePost(row as unknown as TribePostWithAuthor)));
  } catch (error: unknown) {
    if (isMissingRelationError(error)) {
      return res.json([]);
    }
    const message = typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message || 'unknown') : 'unknown';
    throw new AppError(`Failed to list tribe posts: ${message}`, 500, 'TRIBE_POSTS_LIST_FAILED');
  }
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = tribePostSchema.parse(req.body || {});
  try {
    const created = await prisma.tribePost.create({
      data: {
        author_id: userId,
        content: payload.content,
        type: payload.type,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });
    return res.status(201).json(normalizeTribePost(created as unknown as TribePostWithAuthor));
  } catch (error: unknown) {
    if (isMissingRelationError(error)) {
      return tribePostsNotConfigured(res);
    }
    const message = typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message || 'unknown error') : 'unknown error';
    throw new AppError(`Failed to create tribe post: ${message}`, 500, 'TRIBE_POST_CREATE_FAILED');
  }
});

export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  const postId = String(req.params.id || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!postId) {
    return res.status(400).json({ error: 'Post id is required' });
  }

  try {
    const post = await prisma.tribePost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      return res.status(404).json({ code: 'TRIBE_POST_NOT_FOUND', message: 'Post not found' });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.tribePostLike.create({
          data: {
            post_id: postId,
            user_id: userId,
          },
        });
        return tx.tribePost.update({
          where: { id: postId },
          data: { likes_count: { increment: 1 } },
          include: {
            author: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        });
      });

      return res.json({
        success: true,
        alreadyLiked: false,
        post: normalizeTribePost(updated as unknown as TribePostWithAuthor),
      });
    } catch (error: unknown) {
      const code = String((error as { code?: string } | null)?.code || '');
      if (code === 'P2002') {
        const current = await prisma.tribePost.findUnique({
          where: { id: postId },
          include: {
            author: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        });
        if (!current) {
          return res.status(404).json({ code: 'TRIBE_POST_NOT_FOUND', message: 'Post not found' });
        }
        return res.json({
          success: true,
          alreadyLiked: true,
          post: normalizeTribePost(current as unknown as TribePostWithAuthor),
        });
      }
      throw error;
    }
  } catch (error: unknown) {
    if (isMissingRelationError(error)) {
      return tribePostsNotConfigured(res);
    }
    const message = typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message || 'unknown error') : 'unknown error';
    throw new AppError(`Failed to like tribe post: ${message}`, 500, 'TRIBE_POST_LIKE_FAILED');
  }
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

// GET /tribe/pacts/active — retorna pactos ativos do usuário via ProfileLink tipo 'tribo'
export const getActivePacts = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) throw new AppError('Unauthorized', 401);

  // Busca links do tipo 'tribo' aceitos/ativos onde o usuário é source ou target
  const links = await prisma.profileLink.findMany({
    where: {
      status: { in: ['accepted', 'active'] },
      type: 'tribo',
      OR: [
        { source_id: userId },
        { target_id: userId },
      ],
    },
    include: {
      source: { select: { id: true, name: true, avatar: true } },
      target: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  const pacts = links.map((link) => {
    const isSource = link.source_id === userId;
    const partner = isSource ? link.target : link.source;
    return {
      id: link.id,
      partnerId: partner.id,
      partnerName: partner.name || 'Parceiro',
      partnerAvatar: partner.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${partner.id}`,
      missionLabel: 'Pacto de Sintonia',
      myProgress: 0,
      partnerProgress: 0,
      target: 7,
      rewardKarma: 50,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
    };
  });

  return res.json(pacts);
});

// GET /tribe/presence — retorna contagem de usuários online agora
export const getTribePresence = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const count = await prisma.guardianPresence.count({
    where: {
      status: 'ONLINE',
      expires_at: { gt: now },
    },
  });
  return res.json({ count });
});
