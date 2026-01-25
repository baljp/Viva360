import { Router } from 'express';
import * as NotificationsController from '../controllers/notifications.controller';

const router = Router();
router.get('/', NotificationsController.list);
export default router;
