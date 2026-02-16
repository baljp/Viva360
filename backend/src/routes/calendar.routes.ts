import { Router } from 'express';
import * as CalendarController from '../controllers/calendar.controller';

const router = Router();
router.get('/', CalendarController.getEvents);
router.post('/', CalendarController.createEvent);
router.get('/sync', CalendarController.syncToMobile);
router.get('/:id', CalendarController.getEventById);
router.patch('/:id', CalendarController.updateEvent);
router.delete('/:id', CalendarController.deleteEvent);
export default router;
