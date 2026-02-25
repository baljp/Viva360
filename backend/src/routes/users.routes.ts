import { Router } from 'express';
import { getById, updateById, exportData } from '../controllers/users.controller';
import { requireSameUserOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.get('/me/export', exportData);
router.get('/:id', requireSameUserOrAdmin((req) => req.params.id), getById);
router.put('/:id', requireSameUserOrAdmin((req) => req.params.id), updateById);

export default router;
