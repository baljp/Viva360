import { Router } from 'express';
import * as TribeController from '../controllers/tribe.controller';

const router = Router();
router.get('/posts', TribeController.listPosts);
router.post('/posts', TribeController.createPost);
router.post('/posts/:id/like', TribeController.likePost);
router.post('/invite', TribeController.inviteMember);
router.post('/invites/:id/respond', TribeController.respondInvite);
router.post('/join', TribeController.joinTribe);
router.post('/sync', TribeController.syncVibration);
router.get('/invites', TribeController.listInvites);
router.get('/members', TribeController.listMembers);
export default router;
