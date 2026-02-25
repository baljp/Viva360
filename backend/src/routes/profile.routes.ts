import { Router } from 'express';
import * as ProfileController from '../controllers/profile.controller';

const router = Router();

router.get('/', ProfileController.listProfiles);
router.get('/search', ProfileController.searchProfiles);
router.get('/lookup', ProfileController.lookupProfile);
router.get('/me', ProfileController.getProfile);
router.patch('/me', ProfileController.updateProfile);

export default router;
