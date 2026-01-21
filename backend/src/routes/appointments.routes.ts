import { Router } from 'express';
import * as appointmentsController from '../controllers/appointments.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

router.post('/', appointmentsController.createAppointment);
router.get('/', appointmentsController.getUserAppointments);
router.get('/:id', appointmentsController.getAppointmentById);
router.put('/:id/status', appointmentsController.updateAppointmentStatus);
router.delete('/:id', appointmentsController.cancelAppointment);

export default router;
