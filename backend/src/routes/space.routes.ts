
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';
import * as SpaceController from '../controllers/space.controller';

const router = Router();

router.use(authenticateUser);

router.get('/analytics', requireRoles('SPACE', 'ADMIN'), SpaceController.getAnalytics);
router.get('/reviews', requireRoles('SPACE', 'ADMIN'), SpaceController.getReviews);
router.get('/contract', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), SpaceController.getContract);
router.get('/team', requireRoles('SPACE', 'ADMIN'), SpaceController.getTeam);
router.get('/patients', requireRoles('SPACE', 'ADMIN'), SpaceController.getPatients);
router.get('/patients/:id', requireRoles('SPACE', 'ADMIN'), SpaceController.getPatient);
router.post('/rooms', requireRoles('SPACE', 'ADMIN'), SpaceController.createRoom);
router.get('/rooms/:roomId/agenda', requireRoles('SPACE', 'ADMIN'), SpaceController.getRoomAgenda);
router.get('/retreats', requireRoles('SPACE', 'ADMIN'), SpaceController.getRetreats);
router.post('/retreats', requireRoles('SPACE', 'ADMIN'), SpaceController.createRetreat);
router.post('/invites', requireRoles('SPACE', 'ADMIN'), SpaceController.createInvite);
router.get('/', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), SpaceController.listSpaces);

export default router;
