
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import * as SpaceController from '../controllers/space.controller';

const router = Router();

router.use(authenticateUser);

router.get('/analytics', SpaceController.getAnalytics);
router.get('/reviews', SpaceController.getReviews);
router.get('/contract', SpaceController.getContract);
router.get('/team', SpaceController.getTeam);
router.get('/patients', SpaceController.getPatients);
router.get('/patients/:id', SpaceController.getPatient);
router.post('/rooms', SpaceController.createRoom);
router.post('/invites', SpaceController.createInvite);
router.get('/', SpaceController.listSpaces);

export default router;
