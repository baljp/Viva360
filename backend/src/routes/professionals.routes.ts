import { Router } from 'express';
import * as professionalsController from '../controllers/professionals.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', professionalsController.getAllProfessionals);
router.get('/:id', professionalsController.getProfessionalById);

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
