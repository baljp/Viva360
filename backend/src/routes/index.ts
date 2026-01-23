import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import appointmentsRoutes from './appointments.routes';
import marketplaceRoutes from './marketplace.routes';
import notificationsRoutes from './notifications.routes';

const router = Router();

// Public Routes
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

router.use('/auth', authRoutes);
router.use('/profiles', authenticateUser, profileRoutes);
router.use('/appointments', authenticateUser, appointmentsRoutes);
router.use('/marketplace', authenticateUser, marketplaceRoutes);
router.use('/notifications', authenticateUser, notificationsRoutes);

// Protected Routes (Example)
router.use('/protected', authenticateUser, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

// We will mount other routes here as we build them.
// router.use('/appointments', appointmentsRoutes);
// router.use('/marketplace', marketplaceRoutes);

export default router;
