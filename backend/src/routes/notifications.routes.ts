import { Router } from 'express';
import * as NotificationsController from '../controllers/notifications.controller';

const router = Router();

router.get('/', NotificationsController.listNotifications);
router.patch('/:id/read', NotificationsController.markAsRead);

export default router;
