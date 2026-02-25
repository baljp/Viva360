import { Router, Request, Response } from 'express';
import { presenceService } from '../services/presence.service';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();
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
const PRESENCE_BATCH_MAX = 100;
router.post('/batch', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { guardianIds } = req.body as { guardianIds: string[] };
    if (!guardianIds || !Array.isArray(guardianIds)) {
      return res.status(400).json({ error: 'guardianIds array required' });
    }
    if (guardianIds.length > PRESENCE_BATCH_MAX) {
      return res.status(400).json({
        error: `Máximo de ${PRESENCE_BATCH_MAX} IDs por requisição.`,
        code: 'BATCH_LIMIT_EXCEEDED',
        limit: PRESENCE_BATCH_MAX,
        received: guardianIds.length,
      });
    }
    const statuses = await presenceService.getStatusBatch(guardianIds);
    res.json(statuses);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

export default router;
