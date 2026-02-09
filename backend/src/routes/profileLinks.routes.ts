import { Router } from 'express';
import { profileLinkService, LinkType } from '../services/profileLink.service';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Create a link request
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { targetId, type } = req.body as { targetId: string; type: LinkType };
    const sourceId = req.user.id;

    if (!targetId || !type) {
      return res.status(400).json({ error: 'targetId and type are required' });
    }

    const link = await profileLinkService.createLink(sourceId, targetId, type);
    res.status(201).json(link);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Accept a link request
router.post('/:id/accept', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const acceptorId = req.user.id;

    const link = await profileLinkService.acceptLink(id, acceptorId);
    res.json(link);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reject', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rejectorId = req.user.id;

    const link = await profileLinkService.rejectLink(id, rejectorId);
    res.json(link);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get links for current user
router.get('/me', authenticateUser, async (req: any, res) => {
  try {
    const links = await profileLinkService.getLinksForProfile(req.user.id);
    res.json(links);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending requests
router.get('/pending', authenticateUser, async (req: any, res) => {
  try {
    const requests = await profileLinkService.getPendingRequests(req.user.id);
    res.json(requests);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Check if link exists between two profiles
router.get('/check/:targetId', authenticateUser, async (req: any, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.query;

    const hasLink = await profileLinkService.hasActiveLink(
      req.user.id,
      targetId,
      type as LinkType | undefined
    );
    res.json({ hasLink });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a link
router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    await profileLinkService.removeLink(id, req.user.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
