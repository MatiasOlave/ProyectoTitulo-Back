// src/routes/auth/auth.route.ts
import { Router } from 'express';
import { authController } from '../../controllers/auth/auth.controller';

const router = Router();

// Authentication routes
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify', authController.verifyAuth);

// Guardian invitation routes
router.post('/invite-guardian', authController.inviteGuardian);
router.get('/validate-invite/:token', authController.validateInvite);

// Password recovery routes
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Debug route (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-cookies', authController.debugCookies);
}

export default router;