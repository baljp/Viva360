import { Router } from 'express';
import * as RecordsController from '../controllers/records.controller';

const router = Router();

router.post('/', RecordsController.createNote);
router.patch('/:recordId', RecordsController.updateNote);
router.get('/', RecordsController.listNotes);
router.get('/export', RecordsController.exportData);
router.post('/grant', RecordsController.grantAccess);
router.get('/:patientId', RecordsController.listNotes);

export default router;
