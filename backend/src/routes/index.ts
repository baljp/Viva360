import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import appointmentsRoutes from './appointments.routes';

import ritualsRoutes from './rituals.routes';
import financeRoutes from './finance.routes';
import roomsRoutes from './rooms.routes';

import notificationsRoutes from './notifications.routes';
import checkoutRoutes from './checkout.routes';
import chatRoutes from './chat.routes';
import calendarRoutes from './calendar.routes';
import tribeRoutes from './tribe.routes';
import alchemyRoutes from './alchemy.routes';
import oracleRoutes from './oracle.routes';
import marketplaceRoutes from './marketplace.routes';
import recordsRoutes from './records.routes';

import { rateLimiter } from '../middleware/rateLimiter';
import adminRoutes from './admin.routes';

const router = Router();
router.use(rateLimiter); // Upgrade 9.5: Global Rate Limit

// Public Routes
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

router.use('/auth', authRoutes);

// Protected Routes
router.use('/rituals', authenticateUser, ritualsRoutes);
router.use('/finance', authenticateUser, financeRoutes);
router.use('/rooms', authenticateUser, roomsRoutes);
router.use('/profiles', authenticateUser, profileRoutes);
router.use('/appointments', authenticateUser, appointmentsRoutes);

// New Feature Routes
router.use('/notifications', authenticateUser, notificationsRoutes);
router.use('/checkout', authenticateUser, checkoutRoutes);
router.use('/chat', authenticateUser, chatRoutes);
router.use('/calendar', authenticateUser, calendarRoutes);
router.use('/tribe', authenticateUser, tribeRoutes);
router.use('/alchemy', authenticateUser, alchemyRoutes);
router.use('/marketplace', authenticateUser, marketplaceRoutes);
router.use('/oracle', authenticateUser, oracleRoutes);
router.use('/records', authenticateUser, recordsRoutes);

// Admin
router.use('/admin', adminRoutes);

// Protected Test Route (Example)
router.use('/protected', authenticateUser, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

export default router;
