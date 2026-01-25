import { Router } from 'express';
import * as RoomsController from '../controllers/rooms.controller';

const router = Router();

router.get('/real-time', RoomsController.getRealTime);
router.get('/analytics', RoomsController.getAnalytics);
router.patch('/:id/status', RoomsController.updateStatus);

export default router;
