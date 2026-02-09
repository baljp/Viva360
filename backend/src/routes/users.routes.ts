import { Router } from 'express';
import { checkIn, getById, updateById } from '../controllers/users.controller';
import { requireSameUserOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.post('/checkin', checkIn);
router.get('/:id', requireSameUserOrAdmin((req) => req.params.id), getById);
router.put('/:id', requireSameUserOrAdmin((req) => req.params.id), updateById);

export default router;
