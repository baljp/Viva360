import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { tribeService } from '../services/tribe.service';
import { z } from 'zod';
import { interactionReceiptService } from '../services/interactionReceipt.service';
import { supabaseAdmin } from '../services/supabase.service';
import { AppError } from '../lib/AppError';

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
  return code === '42P01' || /relation .* does not exist/i.test(message);
};

const normalizeTribePost = (row: Record<string, unknown>) => ({
  id: String(row.id || ''),
  content: String(row.content || ''),
  type: String(row.type || 'insight'),
  likes: Number(row.likes_count || row.likes || 0),
  created_at: row.created_at || new Date().toISOString(),
  author_id: row.author_id ? String(row.author_id) : null,
  author: row.author ?? null,
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

export const listPosts = asyncHandler(async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('tribe_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingRelationError(error)) {
      return res.json([]);
    }
    throw new AppError(`Failed to list tribe posts: ${error.message}`, 500, 'TRIBE_POSTS_LIST_FAILED');
  }

  return res.json((Array.isArray(data) ? data : []).map((row) => normalizeTribePost((row || {}) as Record<string, unknown>)));
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || '').trim();
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = tribePostSchema.parse(req.body || {});
  const insertPayload: Record<string, unknown> = {
    author_id: userId,
    content: payload.content,
    type: payload.type,
    likes_count: 0,
  };

  let data: unknown = null;
  let error: { message?: string; code?: string } | null = null;

  ({ data, error } = await supabaseAdmin
    .from('tribe_posts')
    .insert(insertPayload)
    .select('*')
    .single());

  if (error && !isMissingRelationError(error)) {
    ({ data, error } = await supabaseAdmin
      .from('tribe_posts')
      .insert({ author_id: userId, content: payload.content })
      .select('*')
      .single());
  }

  if (error) {
    if (isMissingRelationError(error)) {
      return res.status(503).json({
        code: 'TRIBE_POSTS_NOT_CONFIGURED',
        message: 'Tribe posts persistence is not configured in this environment.',
      });
    }
    throw new AppError(`Failed to create tribe post: ${error.message || 'unknown error'}`, 500, 'TRIBE_POST_CREATE_FAILED');
  }

  return res.status(201).json(normalizeTribePost((data || {}) as Record<string, unknown>));
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

  const { data: currentPost, error: fetchError } = await supabaseAdmin
    .from('tribe_posts')
    .select('id, likes_count')
    .eq('id', postId)
    .single();

  if (fetchError) {
    if (isMissingRelationError(fetchError)) {
      return res.status(503).json({
        code: 'TRIBE_POSTS_NOT_CONFIGURED',
        message: 'Tribe posts persistence is not configured in this environment.',
      });
    }
    if (String(fetchError.code || '') === 'PGRST116') {
      return res.status(404).json({ code: 'TRIBE_POST_NOT_FOUND', message: 'Post not found' });
    }
    throw new AppError(`Failed to fetch tribe post: ${fetchError.message}`, 500, 'TRIBE_POST_FETCH_FAILED');
  }

  const nextLikes = Number((currentPost as { likes_count?: number } | null)?.likes_count || 0) + 1;
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('tribe_posts')
    .update({ likes_count: nextLikes })
    .eq('id', postId)
    .select('*')
    .single();

  if (updateError) {
    throw new AppError(`Failed to like tribe post: ${updateError.message}`, 500, 'TRIBE_POST_LIKE_FAILED');
  }

  return res.json({
    success: true,
    post: normalizeTribePost((updated || {}) as Record<string, unknown>),
  });
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
