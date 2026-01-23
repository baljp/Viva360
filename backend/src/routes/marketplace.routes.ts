import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplace.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Public listing? Or protected? Let's make it protected for now as per enterprise requirements usually
router.get('/products', authenticateUser, MarketplaceController.listProducts);
router.post('/purchase', authenticateUser, MarketplaceController.processPurchase);

export default router;
