import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

router.get('/', notificationsController.getUserNotifications);
router.put('/:id/read', notificationsController.markAsRead);
router.put('/read-all', notificationsController.markAllAsRead);
router.post('/', notificationsController.createNotification);

export default router;
