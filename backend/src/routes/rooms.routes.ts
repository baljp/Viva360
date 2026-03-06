import { Router } from 'express';
import * as RoomsController from '../controllers/rooms.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

router.get('/', requireRoles('SPACE', 'ADMIN'), RoomsController.getRealTime);
router.get('/real-time', requireRoles('SPACE', 'ADMIN'), RoomsController.getRealTime);
router.get('/analytics', requireRoles('SPACE', 'ADMIN'), RoomsController.getAnalytics);
router.get('/vacancies', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), RoomsController.listVacancies);
router.post('/vacancies', requireRoles('SPACE', 'ADMIN'), RoomsController.createVacancy);
router.patch('/:id/status', requireRoles('SPACE', 'ADMIN'), RoomsController.updateStatus);
router.patch('/:id', requireRoles('SPACE', 'ADMIN'), RoomsController.updateRoom);

export default router;
