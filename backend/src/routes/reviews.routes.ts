
import { Router } from 'express';
import { reviewsController } from '../controllers/reviews.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, reviewsController.create);
router.get('/', reviewsController.list);

export default router;
