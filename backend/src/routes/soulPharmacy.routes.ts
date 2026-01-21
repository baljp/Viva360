import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as soulPharmacy from '../controllers/soulPharmacy.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Soul Pills
router.get('/pills', soulPharmacy.listPills);
router.get('/pills/suggestions', soulPharmacy.getSuggestions);
router.get('/pills/:id', soulPharmacy.getPill);
router.post('/pills', soulPharmacy.createPill);
router.post('/pills/:id/purchase', soulPharmacy.purchasePill);
router.patch('/pills/:id/progress', soulPharmacy.updateProgress);
router.get('/my-purchases', soulPharmacy.getMyPurchases);

// Mood entries
router.post('/mood', soulPharmacy.createMoodEntry);
router.get('/mood/history', soulPharmacy.getMoodHistory);
router.get('/mood/gallery', soulPharmacy.getPhotoGallery);

export default router;
