import { Router } from 'express';
import { saveRoutine, getRoutine } from '../controllers/rituals.controller';

const router = Router();

router.post('/', saveRoutine);
router.get('/', getRoutine);

export default router;
