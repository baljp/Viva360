import { Router } from 'express';
import * as FinanceController from '../controllers/finance.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

router.get('/summary', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.getSummary);
router.get('/transactions', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.getTransactions);

export default router;
