import { Router } from 'express';
import { presenceService } from '../services/presence.service';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Set status to ONLINE
router.post('/online', authenticateUser, async (req: any, res) => {
  try {
    const presence = await presenceService.goOnline(req.user.id);
    res.json(presence);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Set status to OFFLINE
router.post('/offline', authenticateUser, async (req: any, res) => {
  try {
    const presence = await presenceService.goOffline(req.user.id);
    res.json(presence);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ping to extend session
router.post('/ping', authenticateUser, async (req: any, res) => {
  try {
    const presence = await presenceService.ping(req.user.id);
    res.json(presence);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user's presence
router.get('/me', authenticateUser, async (req: any, res) => {
  try {
    const status = await presenceService.getStatus(req.user.id);
    res.json({ status });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get presence for specific guardian
router.get('/:guardianId', async (req, res) => {
  try {
    const { guardianId } = req.params;
    const status = await presenceService.getStatus(guardianId);
    res.json({ guardianId, status });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get online guardians
router.get('/', async (req, res) => {
  try {
    const onlineIds = await presenceService.getOnlineGuardians();
    res.json({ online: onlineIds });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Batch get presence
router.post('/batch', async (req, res) => {
  try {
    const { guardianIds } = req.body as { guardianIds: string[] };
    if (!guardianIds || !Array.isArray(guardianIds)) {
      return res.status(400).json({ error: 'guardianIds array required' });
    }
    const statuses = await presenceService.getStatusBatch(guardianIds);
    res.json(statuses);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
