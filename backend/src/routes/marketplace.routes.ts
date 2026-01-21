import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplace.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', marketplaceController.getAllProducts);
router.get('/:id', marketplaceController.getProductById);

// Protected routes
router.post('/', authenticateToken, marketplaceController.createProduct);

export default router;
