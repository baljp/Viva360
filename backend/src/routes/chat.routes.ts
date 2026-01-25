import { Router } from 'express';
import * as ChatController from '../controllers/chat.controller';

const router = Router();
router.post('/send', ChatController.sendMessage);
router.get('/history', ChatController.getHistory);
export default router;
