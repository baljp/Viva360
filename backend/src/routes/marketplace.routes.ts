import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplace.controller';

const router = Router();
router.post('/products', MarketplaceController.createProduct);
router.get('/products', MarketplaceController.listProducts);
router.post('/purchase', MarketplaceController.purchaseProduct);
router.delete('/products/:id', MarketplaceController.deleteProduct);
export default router;
