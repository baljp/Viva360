import { Router } from 'express';
import * as AlchemyController from '../controllers/alchemy.controller';

const router = Router();
router.post('/offers', AlchemyController.createOffer);
router.get('/offers', AlchemyController.listOffers);
export default router;
