
import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

// Middleware to inject adminId for mock (Verification later)
const mockAdminMiddleware = (req: any, res: any, next: any) => {
    // In real implementation this checks the JWT role.
    // For now we assume if the route is hit with 'admin-token', it works.
    req.body.adminId = 'admin_master';
    next();
};

router.use(mockAdminMiddleware);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.listUsers);
router.post('/users/:id/block', AdminController.blockUser);
router.get('/metrics/seekers', AdminController.getSeekerMetrics);
router.get('/metrics/guardians', AdminController.getGuardianMetrics);
router.get('/metrics/sanctuaries', AdminController.getSanctuaryMetrics);
router.get('/marketplace/offers', AdminController.getMarketplaceOffers);
router.get('/finance/global', AdminController.getGlobalFinance);
router.get('/lgpd/audit', AdminController.getLgpdAudit);
router.get('/system/health', AdminController.getSystemHealth);

export default router;
