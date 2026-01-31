import { Router } from 'express';
import { getExecutiveMetrics } from '../controllers/executive.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { adminOnlyMiddleware } from '../middleware/admin.middleware'; // Assuming it exists or using similar role check

const router = Router();

// Only Admins can see raw business metrics
router.get('/metrics', authenticateUser, adminOnlyMiddleware, getExecutiveMetrics);

export default router;
