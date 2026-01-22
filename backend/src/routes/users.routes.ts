import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Current user routes
router.get('/profile', usersController.getMe);          // GET own profile
router.patch('/profile', usersController.updateUserProfile);  // UPDATE own profile

// User interaction routes
router.get('/:id', usersController.getUserProfile);     // GET any user by ID
router.post('/check-in', usersController.checkIn);      // Daily check-in
router.put('/balance', usersController.updateBalance);  // Update balance

export default router;
