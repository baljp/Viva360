import { Router } from 'express';
import { createOffer, listOffers, proposeMatch } from '../controllers/swaps.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken); // All swap routes require auth

router.post('/offers', authorizeRoles('PROFESSIONAL', 'SPACE'), createOffer);
router.get('/offers', listOffers);
router.post('/:targetId/match', authorizeRoles('PROFESSIONAL', 'SPACE'), proposeMatch);

export default router;
