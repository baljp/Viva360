import { Router } from 'express';
import * as CheckoutController from '../controllers/checkout.controller';

const router = Router();
import { validate } from '../middleware/validate.middleware';
import { checkoutSchema } from '../schemas/checkout.schema';

router.post('/pay', validate(checkoutSchema), CheckoutController.processPayment);
export default router;
