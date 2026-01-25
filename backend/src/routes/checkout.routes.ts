import { Router } from 'express';
import * as CheckoutController from '../controllers/checkout.controller';

const router = Router();
router.post('/pay', CheckoutController.processPayment);
export default router;
