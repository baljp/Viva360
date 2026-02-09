import { Router } from 'express';
import * as AuditController from '../controllers/audit.controller';

const router = Router();

router.get('/logs', AuditController.listLogs);

export default router;

