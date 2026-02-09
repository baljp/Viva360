import { Router } from 'express';
import * as TribeController from '../controllers/tribe.controller';

const router = Router();
router.post('/invite', TribeController.inviteMember);
router.post('/join', TribeController.joinTribe);
router.post('/sync', TribeController.syncVibration);
router.get('/invites', TribeController.listInvites);
router.get('/members', TribeController.listMembers);
export default router;
