import { Router, Request, Response } from 'express';
import { profileLinkService, LinkType } from '../services/profileLink.service';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();
type ErrorWithMessage = { message?: string };
const getUserId = (req: Request) => String(req.user?.id || req.user?.userId || '').trim();
const errorMessage = (error: unknown) =>
  (typeof error === 'object' && error && 'message' in error ? String((error as ErrorWithMessage).message || 'Request failed') : 'Request failed');

// Create a link request
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { targetId, type } = req.body as { targetId: string; type: LinkType };
    const sourceId = getUserId(req);
    if (!sourceId) return res.status(401).json({ error: 'Unauthorized' });

    if (!targetId || !type) {
      return res.status(400).json({ error: 'targetId and type are required' });
    }

    const link = await profileLinkService.createLink(sourceId, targetId, type);
    res.status(201).json(link);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Accept a link request
router.post('/:id/accept', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const acceptorId = getUserId(req);
    if (!acceptorId) return res.status(401).json({ error: 'Unauthorized' });

    const link = await profileLinkService.acceptLink(id, acceptorId);
    res.json(link);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

router.post('/:id/reject', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rejectorId = getUserId(req);
    if (!rejectorId) return res.status(401).json({ error: 'Unauthorized' });

    const link = await profileLinkService.rejectLink(id, rejectorId);
    res.json(link);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Get links for current user
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const links = await profileLinkService.getLinksForProfile(userId);
    res.json(links);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Get pending requests
router.get('/pending', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const requests = await profileLinkService.getPendingRequests(userId);
    res.json(requests);
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Check if link exists between two profiles
router.get('/check/:targetId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { targetId } = req.params;
    const { type } = req.query;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const hasLink = await profileLinkService.hasActiveLink(
      userId,
      targetId,
      type as LinkType | undefined
    );
    res.json({ hasLink });
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

// Delete a link
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await profileLinkService.removeLink(id, userId);
    res.status(204).send();
  } catch (error: unknown) {
    res.status(400).json({ error: errorMessage(error) });
  }
});

export default router;
