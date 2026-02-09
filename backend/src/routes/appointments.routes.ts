import { Router } from 'express';
import * as AppointmentsController from '../controllers/appointments.controller';

const router = Router();

router.get('/', AppointmentsController.listAppointments);
router.get('/me', AppointmentsController.listAppointments);
router.post('/', AppointmentsController.createAppointment);
router.patch('/:id/reschedule', AppointmentsController.rescheduleAppointment);
router.patch('/:id/cancel', AppointmentsController.cancelAppointment);

export default router;
