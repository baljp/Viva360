import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as RecoverController from '../controllers/recover.controller';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/forgot-password', RecoverController.forgotPassword);
router.post('/reset-password', RecoverController.resetPassword);

export default router;
