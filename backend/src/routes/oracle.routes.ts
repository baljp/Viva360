import { Router } from 'express';
import { drawCard, getHistory } from '../controllers/oracle.controller';

const router = Router();

router.post('/draw', drawCard);
router.get('/history', getHistory);

export default router;
