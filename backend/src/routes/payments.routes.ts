import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createPaymentIntent } from '../controllers/payments.controller';
import { paymentCircuitBreaker } from '../utils/circuitBreaker';

const router = Router();

router.use(authenticateToken);

router.post('/create-payment-intent', (req, res, next) => {
    paymentCircuitBreaker.fire(() => createPaymentIntent(req, res, next) as any)
        .catch(next);
});

export default router;
