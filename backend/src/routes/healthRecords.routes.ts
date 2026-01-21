import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as healthRecords from '../controllers/healthRecords.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Patient routes
router.get('/my-records', healthRecords.getMyRecords);
router.get('/access-history', healthRecords.getAccessHistory);
router.patch('/:id/sharing', healthRecords.updateSharing);
router.delete('/:id/revoke', healthRecords.revokeAccess);
router.delete('/revoke-all', healthRecords.revokeAllAccess);

// LGPD Data rights
router.get('/export', healthRecords.exportAllData);
router.post('/delete', healthRecords.deleteMyData);

// Professional routes
router.get('/shared-with-me', healthRecords.getSharedWithMe);
router.post('/', healthRecords.createRecord);

export default router;
