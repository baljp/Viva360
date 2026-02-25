import { Router, Request, Response } from 'express';
import { presenceService } from '../services/presence.service';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();
const MAX_BATCH_GUARDIAN_IDS = 100;
type ErrorWithMessage = { message?: string };
const getUserId = (req: Request) => String(req.user?.id || req.user?.userId || '').trim();
const errorMessage = (error: unknown) =>
  (typeof error === 'object' && error && 'message' in error ? String((error as ErrorWithMessage).message || 'Request failed') : 'Request failed');

// Set status to ONLINE
router.post('/online', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const presence = await presenceService.goOnline(userId);
    res.json(presence);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Set status to OFFLINE
router.post('/offline', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const presence = await presenceService.goOffline(userId);
    res.json(presence);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Ping to extend session
router.post('/ping', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const presence = await presenceService.ping(userId);
    res.json(presence);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Get current user's presence
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const status = await presenceService.getStatus(userId);
    res.json({ status });
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Get presence for specific guardian
router.get('/:guardianId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { guardianId } = req.params;
    const status = await presenceService.getStatus(guardianId);
    res.json({ guardianId, status });
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Get online guardians
router.get('/', authenticateUser, async (_req: Request, res: Response) => {
  try {
    const onlineIds = await presenceService.getOnlineGuardians();
    res.json({ online: onlineIds });
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Batch get presence
router.post('/batch', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { guardianIds } = req.body as { guardianIds: unknown };
    if (!guardianIds || !Array.isArray(guardianIds)) {
      return res.status(400).json({ error: 'guardianIds array required' });
    }

    const normalizedIds = guardianIds
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: 'guardianIds must contain at least one valid id' });
    }

    const uniqueIds = Array.from(new Set(normalizedIds));

    if (uniqueIds.length > MAX_BATCH_GUARDIAN_IDS) {
      return res.status(400).json({
        error: `guardianIds max ${MAX_BATCH_GUARDIAN_IDS} items`,
        code: 'PRESENCE_BATCH_LIMIT_EXCEEDED',
        max: MAX_BATCH_GUARDIAN_IDS,
        received: uniqueIds.length,
      });
    }

    const statuses = await presenceService.getStatusBatch(uniqueIds);
    res.json(statuses);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

export default router;
