import { Router } from 'express';
import * as RecordsController from '../controllers/records.controller';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();

// Sensitive routes: ADMIN must not access clinical records.
router.use(requireRoles('CLIENT', 'PROFESSIONAL', 'SPACE'));

router.post('/', RecordsController.createNote);
router.patch('/:recordId', RecordsController.updateNote);
router.get('/', RecordsController.listNotes);
router.get('/export', RecordsController.exportData);
router.get('/access', RecordsController.listAccess);
router.post('/grant', RecordsController.grantAccess);
router.post('/revoke', RecordsController.revokeAccess);
router.get('/:patientId', RecordsController.listNotes);

export default router;
