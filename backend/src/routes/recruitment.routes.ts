import { Router } from 'express';
import { requireRoles } from '../middleware/role.middleware';
import * as RecruitmentController from '../controllers/recruitment.controller';

const router = Router();

router.get('/applications', requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE', 'ADMIN'), RecruitmentController.listApplications);
router.post('/applications', requireRoles('CLIENT', 'PROFESSIONAL', 'ADMIN'), RecruitmentController.createApplication);
router.post('/applications/:id/interview', requireRoles('SPACE', 'ADMIN'), RecruitmentController.scheduleInterview);
router.post('/interviews/:id/respond', requireRoles('PROFESSIONAL', 'ADMIN'), RecruitmentController.respondInterview);
router.post('/applications/:id/decision', requireRoles('SPACE', 'ADMIN'), RecruitmentController.decideApplication);

export default router;
