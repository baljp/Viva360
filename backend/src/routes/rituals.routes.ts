import { Router } from 'express';
import { saveRoutine, getRoutine, toggleRoutine } from '../controllers/rituals.controller';

const router = Router();

router.post('/', saveRoutine);
router.get('/', getRoutine);
router.get('/:period', getRoutine);
router.post('/:period/:id/toggle', toggleRoutine);

export default router;
