import { Router } from 'express';
import * as NotificationsController from '../controllers/notifications.controller';

const router = Router();
router.get('/', NotificationsController.list);
router.post('/:id/read', NotificationsController.markAsRead);
router.post('/read-all', NotificationsController.markAllAsRead);
export default router;
