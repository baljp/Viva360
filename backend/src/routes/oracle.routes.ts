import { Router } from 'express';
import { drawCard, getHistory } from '../controllers/oracle.controller';

import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

router.post('/draw', drawCard);
router.get('/history', cacheMiddleware(3600), getHistory); // Cache for 1 hour

export default router;
