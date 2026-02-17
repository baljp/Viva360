import { Router } from 'express';
import { getReviews, getReviewSummary, createReview } from '../controllers/reviews.controller';

const router = Router();

// FLOW-05: POST /reviews — submit service evaluation
router.post('/', createReview);
router.get('/:spaceId', getReviews);
router.get('/:spaceId/summary', getReviewSummary);

export default router;
