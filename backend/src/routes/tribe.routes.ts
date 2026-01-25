import { Router } from 'express';
import * as TribeController from '../controllers/tribe.controller';

const router = Router();
router.post('/invite', TribeController.inviteMember);
router.get('/invites', TribeController.listInvites);
export default router;
