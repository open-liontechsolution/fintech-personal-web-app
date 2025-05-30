import { Router } from 'express';
import authController from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// Password reset routes
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/invitation-code', requireAuth, authController.generateInvitationCode);

export default router;
