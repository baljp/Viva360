import { Router } from 'express';
import * as TribeController from '../controllers/tribe.controller';

const router = Router();
router.post('/invite', TribeController.inviteMember);
router.get('/invites', TribeController.listInvites);
router.get('/members', TribeController.listMembers);
export default router;
