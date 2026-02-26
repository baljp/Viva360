import { Router } from 'express';
import * as SeriesController from '../controllers/series.controller';

const router = Router();

// POST /appointments/series/preview — sem escritas no DB
router.post('/preview', SeriesController.previewAppointmentSeries);

// POST /appointments/series
router.post('/', SeriesController.createAppointmentSeries);

// GET /appointments/series/:id
router.get('/:id', SeriesController.getAppointmentSeries);

// PATCH /appointments/series/:id — 501 em v1
router.patch('/:id', SeriesController.updateAppointmentSeries);

// DELETE /appointments/series/:id
router.delete('/:id', SeriesController.deleteAppointmentSeries);

export default router;
