import { Router } from 'express';
import * as FinanceController from '../controllers/finance.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

router.get('/summary', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.getSummary);
router.get('/transactions', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.getTransactions);
router.get('/client/summary', requireRoles('CLIENT'), FinanceController.getClientSummary);
router.get('/export', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.exportReport);
router.post('/withdraw', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.requestWithdrawal);
router.post('/donate', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.donate);
router.post('/reinvest', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), FinanceController.reinvest);

export default router;
