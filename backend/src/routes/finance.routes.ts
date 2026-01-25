import { Router } from 'express';
import * as FinanceController from '../controllers/finance.controller';

const router = Router();

router.get('/summary', FinanceController.getSummary);
router.get('/transactions', FinanceController.getTransactions);

export default router;
