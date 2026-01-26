import { Router } from 'express';
import * as RoomsController from '../controllers/rooms.controller';

const router = Router();

router.get('/', RoomsController.getRealTime);
router.get('/real-time', RoomsController.getRealTime);
router.get('/analytics', RoomsController.getAnalytics);
router.get('/vacancies', RoomsController.listVacancies);
router.post('/vacancies', RoomsController.createVacancy);
router.patch('/:id/status', RoomsController.updateStatus);

export default router;
