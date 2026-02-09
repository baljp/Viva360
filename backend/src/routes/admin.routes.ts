import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { adminOnlyMiddleware } from '../middleware/admin.middleware';

const router = Router();

router.use(adminOnlyMiddleware);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.listUsers);
router.post('/users/:id/block', AdminController.blockUser);
router.get('/metrics/seekers', AdminController.getSeekerMetrics);
router.get('/metrics/guardians', AdminController.getGuardianMetrics);
router.get('/metrics/sanctuaries', AdminController.getSanctuaryMetrics);
router.get('/metrics', AdminController.getMetrics);
router.get('/marketplace/offers', AdminController.getMarketplaceOffers);
router.get('/finance/global', AdminController.getGlobalFinance);
router.get('/lgpd/audit', AdminController.getLgpdAudit);
router.get('/system/health', AdminController.getSystemHealth);

export default router;
