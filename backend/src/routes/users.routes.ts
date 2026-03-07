import { Router } from 'express';
import { checkIn as dailyBlessingCheckIn, getById, updateById, exportData, waterPlant, getEvolutionMetrics, socialBless } from '../controllers/users.controller';
import { requireSameUserOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.get('/me/export', exportData);
router.post('/daily-blessing', dailyBlessingCheckIn);
router.post('/:id/water', requireSameUserOrAdmin((req) => req.params.id), waterPlant);
router.get('/:id/evolution/metrics', requireSameUserOrAdmin((req) => req.params.id), getEvolutionMetrics);
router.post('/bless', socialBless); // New atomic blessing (P1)
router.get('/:id', requireSameUserOrAdmin((req) => req.params.id), getById);
router.put('/:id', requireSameUserOrAdmin((req) => req.params.id), updateById);

export default router;
