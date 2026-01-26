import { Router } from 'express';
import { checkIn, getEvolution } from '../controllers/metamorphosis.controller';

const router = Router();

router.post('/checkin', checkIn);
router.get('/evolution', getEvolution);

export default router;
