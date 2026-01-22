import { Router } from 'express';
import * as financialSplitsController from '../controllers/financialSplits.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All finance routes require authentication
router.use(authenticateToken);

// Financial summary - for professionals and spaces
router.get(
  '/summary',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  financialSplitsController.getFinanceSummary
);

// Transaction history
router.get(
  '/transactions',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  financialSplitsController.getTransactionHistory
);

// Process split after appointment completion (admin/system call)
router.post(
  '/process-split/:appointmentId',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  financialSplitsController.processAppointmentSplit
);

// Update commission rate - Space owners only
router.patch(
  '/commission/:memberId',
  authorizeRoles('SPACE'),
  financialSplitsController.updateCommissionRate
);

// Team performance metrics - Space owners only
router.get(
  '/team-performance',
  authorizeRoles('SPACE'),
  financialSplitsController.getTeamPerformance
);

// Request withdrawal
router.post(
  '/withdraw',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  financialSplitsController.requestWithdrawal
);

export default router;
