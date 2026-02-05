import { Router } from 'express';
import { checkIn } from '../controllers/users.controller';

const router = Router();

router.post('/checkin', checkIn);

export default router;
