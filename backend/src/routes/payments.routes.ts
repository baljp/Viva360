import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createPaymentIntent } from '../controllers/payments.controller';

const router = Router();

router.use(authenticateToken);

router.post('/create-payment-intent', createPaymentIntent);

export default router;
