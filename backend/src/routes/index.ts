import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import appointmentsRoutes from './appointments.routes';
import seriesRoutes from './series.routes';
import recruitmentRoutes from './recruitment.routes';

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
import usersRoutes from './users.routes';
import invitesRoutes from './invites.routes';
import reviewsRoutes from './reviews.routes';

import { rateLimiter } from '../middleware/rateLimiter';
import { swrMiddleware } from '../middleware/swr.middleware';
import adminRoutes from './admin.routes';
import executiveRoutes from './executive.routes';
import journalRoutes from './journal.routes';
import clinicalRoutes from './clinical.routes';
import auditRoutes from './audit.routes';
import spaceRoutes from './space.routes';

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
router.use('/appointments/series', authenticateUser, seriesRoutes);
router.use('/recruitment', authenticateUser, recruitmentRoutes);

// New Feature Routes
router.use('/users', authenticateUser, usersRoutes);
router.use('/notifications', authenticateUser, notificationsRoutes);
router.use('/checkout', authenticateUser, checkoutRoutes);
router.use('/chat', authenticateUser, chatRoutes);
router.use('/calendar', authenticateUser, calendarRoutes);
router.use('/tribe', authenticateUser, swrMiddleware(1, 59), tribeRoutes);
router.use('/alchemy', authenticateUser, alchemyRoutes);
router.use('/marketplace', authenticateUser, swrMiddleware(1, 59), marketplaceRoutes);
router.use('/oracle', authenticateUser, oracleRoutes);
router.use('/records', authenticateUser, recordsRoutes);
router.use('/reviews', authenticateUser, reviewsRoutes);
router.use('/journal', authenticateUser, journalRoutes);
router.use('/clinical', authenticateUser, clinicalRoutes);
router.use('/audit', authenticateUser, auditRoutes);
router.use('/spaces', authenticateUser, spaceRoutes);
router.use('/invites', invitesRoutes);

// Admin
router.use('/admin', authenticateUser, adminRoutes);
router.use('/admin/executive', authenticateUser, executiveRoutes);

import metamorphosisRoutes from './metamorphosis.routes';
import profileLinksRoutes from './profileLinks.routes';
import presenceRoutes from './presence.routes';
import gamificationRoutes from './gamification.routes';

// ... (other imports)

router.use('/metamorphosis', authenticateUser, metamorphosisRoutes);
router.use('/links', authenticateUser, profileLinksRoutes);
router.use('/presence', presenceRoutes); // Presence can be partially public
router.use('/gamification', authenticateUser, gamificationRoutes);

import soulCardsRoutes from './soulCards.routes';
router.use('/soul-cards', authenticateUser, soulCardsRoutes);

import videoRoutes from './video.routes';
router.use('/video', authenticateUser, videoRoutes);

export default router;
