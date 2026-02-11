import { Router } from 'express';
import { getReviews, getReviewSummary } from '../controllers/reviews.controller';

const router = Router();

router.get('/:spaceId', getReviews);
router.get('/:spaceId/summary', getReviewSummary);

export default router;
