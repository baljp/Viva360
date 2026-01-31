import { Router } from 'express';
import { drawCard, getHistory, getToday } from '../controllers/oracle.controller';

import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

router.post('/draw', drawCard);
router.get('/today', getToday);
router.get('/history', cacheMiddleware(3600), getHistory); // Cache for 1 hour

export default router;
