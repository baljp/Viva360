import { Router } from 'express';
import * as ProfileController from '../controllers/profile.controller';

const router = Router();

router.get('/', ProfileController.listProfiles);
router.get('/me', ProfileController.getProfile);
router.patch('/me', ProfileController.updateProfile);

export default router;
