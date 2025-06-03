import { Router } from 'express';
import invitationController from '../controllers/invitationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Protected routes - all require authentication
router.get('/', requireAuth, invitationController.getUserInvitations);
router.post('/', requireAuth, invitationController.generateInvitationCode);

export default router;
