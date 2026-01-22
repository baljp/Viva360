import { Router } from 'express';
import * as professionalsController from '../controllers/professionals.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { cacheControl } from '../middleware/cache';

const router = Router();

// Public routes
router.get('/', cacheControl(300), professionalsController.getAllProfessionals); // 5 min cache
router.get('/:id', cacheControl(300), professionalsController.getProfessionalById); // 5 min cache

// Protected routes
router.put(
  '/profile',
  authenticateToken,
  authorizeRoles('PROFESSIONAL'),
  professionalsController.updateProfessional
);

router.get(
  '/me/patients',
  authenticateToken,
  authorizeRoles('PROFESSIONAL'),
  professionalsController.getProfessionalPatients
);

router.get(
  '/me/finance',
  authenticateToken,
  authorizeRoles('PROFESSIONAL'),
  professionalsController.getProfessionalFinance
);

export default router;
