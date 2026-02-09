import { Router } from 'express';
import * as MarketplaceController from '../controllers/marketplace.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

router.get('/products', MarketplaceController.listProducts);
router.get('/', MarketplaceController.listProducts); // backward-compatible alias

router.post('/products', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), MarketplaceController.createProduct);
router.post('/', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), MarketplaceController.createProduct); // alias

router.post('/purchase', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), MarketplaceController.purchaseProduct);

router.delete('/products/:id', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), MarketplaceController.deleteProduct);
router.delete('/:id', requireRoles('PROFESSIONAL', 'SPACE', 'ADMIN'), MarketplaceController.deleteProduct); // alias

export default router;
