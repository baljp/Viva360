import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Get user's order history
router.get('/', ordersController.getOrders);

// Get specific order
router.get('/:id', ordersController.getOrderById);

// Create new order
router.post('/', ordersController.createOrder);

// Update order status (admin/professional only in production)
router.patch('/:id/status', ordersController.updateOrderStatus);

export default router;
