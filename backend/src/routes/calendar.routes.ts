import { Router } from 'express';
import * as CalendarController from '../controllers/calendar.controller';

const router = Router();
router.get('/', CalendarController.getEvents);
router.post('/', CalendarController.createEvent);
router.get('/sync', CalendarController.syncToMobile);
export default router;
