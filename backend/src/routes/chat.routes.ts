import { Router } from 'express';
import * as ChatController from '../controllers/chat.controller';

const router = Router();

router.get('/rooms', ChatController.listRooms);
router.post('/rooms/join', ChatController.joinRoom);
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);
router.post('/rooms/:roomId/messages', ChatController.sendRoomMessage);

router.post('/send', ChatController.sendMessage);
router.get('/history', ChatController.getHistory);
export default router;
