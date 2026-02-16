import { Router } from 'express';
import * as RoomsController from '../controllers/rooms.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

router.get('/', RoomsController.getRealTime);
router.get('/real-time', RoomsController.getRealTime);
router.get('/analytics', RoomsController.getAnalytics);
router.get('/vacancies', RoomsController.listVacancies);
router.post('/vacancies', requireRoles('SPACE', 'ADMIN'), RoomsController.createVacancy);
router.patch('/:id/status', requireRoles('SPACE', 'ADMIN'), RoomsController.updateStatus);
router.patch('/:id', requireRoles('SPACE', 'ADMIN'), RoomsController.updateRoom);

export default router;
