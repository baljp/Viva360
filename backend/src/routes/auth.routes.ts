import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as RecoverController from '../controllers/recover.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/precheck-login', authRateLimiter, AuthController.precheckLogin);
router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/oauth/ensure-profile', authenticateUser, AuthController.ensureOAuthProfile);
router.get('/roles', authenticateUser, AuthController.listRoles);
router.post('/select-role', authenticateUser, AuthController.selectRole);
router.post('/add-role', authenticateUser, AuthController.addRole);
router.delete('/account', authenticateUser, AuthController.deleteAccount);
router.post('/forgot-password', authRateLimiter, RecoverController.forgotPassword); // Add schema later
router.post('/reset-password', authRateLimiter, RecoverController.resetPassword); // Add schema later

export default router;
