import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

router.get('/:id', usersController.getUserProfile);
router.put('/profile', usersController.updateUserProfile);
router.post('/checkin', usersController.checkIn);
router.put('/balance', usersController.updateBalance);

export default router;
