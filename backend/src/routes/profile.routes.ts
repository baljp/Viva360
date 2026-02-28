import { Router } from 'express';
import * as ProfileController from '../controllers/profile.controller';

const router = Router();

router.get('/', ProfileController.listProfiles);
router.get('/search', ProfileController.searchProfiles);
router.get('/lookup', ProfileController.lookupProfile);
router.get('/me', ProfileController.getProfile);
router.patch('/me', ProfileController.updateProfile);
router.get('/:id/metrics', ProfileController.getProfessionalMetrics); // Guardião P2
router.get('/:id/space-patients', ProfileController.getSpacePatientsSummary); // Santuário P2
router.post('/:id/boost', ProfileController.adminRadianceBoost); // Admin (10-10)

export default router;
