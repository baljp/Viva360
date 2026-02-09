import { Router } from 'express';
import * as AlchemyController from '../controllers/alchemy.controller';

const router = Router();
router.post('/offers', AlchemyController.createOffer);
router.get('/offers', AlchemyController.listOffers);
router.post('/offers/:id/accept', AlchemyController.acceptOffer);
router.post('/offers/:id/reject', AlchemyController.rejectOffer);
router.post('/offers/:id/counter', AlchemyController.counterOffer);
router.post('/offers/:id/complete', AlchemyController.completeOffer);
export default router;
