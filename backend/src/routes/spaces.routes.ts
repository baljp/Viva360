import { Router } from 'express';
import * as spacesController from '../controllers/spaces.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/vacancies', spacesController.getAllVacancies);

// Protected routes for space owners
router.get(
  '/rooms',
  authenticateToken,
  authorizeRoles('SPACE'),
  spacesController.getSpaceRooms
);

router.post(
  '/rooms',
  authenticateToken,
  authorizeRoles('SPACE'),
  spacesController.createRoom
);

router.get(
  '/team',
  authenticateToken,
  authorizeRoles('SPACE'),
  spacesController.getSpaceTeam
);

router.get(
  '/my-vacancies',
  authenticateToken,
  authorizeRoles('SPACE'),
  spacesController.getSpaceVacancies
);

router.post(
  '/vacancies',
  authenticateToken,
  authorizeRoles('SPACE'),
  spacesController.createVacancy
);

export default router;
