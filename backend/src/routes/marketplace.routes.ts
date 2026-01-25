import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplace.controller';

const router = Router();
router.post('/products', MarketplaceController.createProduct);
router.get('/products', MarketplaceController.listProducts);
export default router;
