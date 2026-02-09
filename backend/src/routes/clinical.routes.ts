import { Router } from 'express';
import * as ClinicalController from '../controllers/clinical.controller';

const router = Router();

router.post('/interventions', ClinicalController.saveIntervention);
router.get('/interventions', ClinicalController.listInterventions);

export default router;

