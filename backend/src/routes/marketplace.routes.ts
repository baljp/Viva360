import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplace.controller';
import { authenticateToken } from '../middleware/auth';

import { cacheControl } from '../middleware/cache';

const router = Router();

// Public routes (Cached for 5 minutes)
router.get('/', cacheControl(300), marketplaceController.getAllProducts);
router.get('/:id', cacheControl(300), marketplaceController.getProductById);

// Protected routes
router.post('/', authenticateToken, marketplaceController.createProduct);

export default router;
