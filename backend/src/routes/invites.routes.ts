import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import * as InvitesController from '../controllers/invites.controller';
import { publicTokenRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public: allow landing page to resolve token metadata without being logged in.
router.get('/resolve/:token', publicTokenRateLimiter, InvitesController.resolveInvite);

// Protected: issue + accept require authentication.
router.post('/create', authenticateUser, InvitesController.createInvite);
router.post('/accept', authenticateUser, InvitesController.acceptInvite);

export default router;
