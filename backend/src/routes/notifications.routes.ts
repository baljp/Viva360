import { Router } from 'express';
import * as N from '../controllers/notifications.controller';

const router = Router();

// In-app
router.get('/',          N.list);
router.post('/read-all', N.markAllAsRead);
router.post('/:id/read', N.markAsRead);

// Web Push — VAPID key (no auth required; browser calls this before subscribing)
router.get('/push/vapid-key', N.getVapidKey);

// Web Push — subscription management (auth required via parent router)
router.post('/push/subscribe',   N.subscribe);
router.delete('/push/subscribe', N.unsubscribe);

export default router;
