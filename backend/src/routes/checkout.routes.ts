import { Router } from 'express';
import * as CheckoutController from '../controllers/checkout.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();
import { validate } from '../middleware/validate.middleware';
import { checkoutSchema } from '../schemas/checkout.schema';

router.post('/pay', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), validate(checkoutSchema), CheckoutController.processPayment);
export default router;
