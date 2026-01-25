import { Router } from 'express';
import * as RitualsController from '../controllers/rituals.controller';

const router = Router();

router.get('/status', RitualsController.getStatus);
router.get('/quests', RitualsController.getQuests);
router.post('/check-in', RitualsController.checkIn);

export default router;
