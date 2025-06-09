import { Router } from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactionRoutes';
import healthRoutes from './healthRoutes';
import invitationRoutes from './invitationRoutes';
import accountRoutes from './accountRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/invitations', invitationRoutes);
router.use('/accounts', accountRoutes);

// Health checks para Kubernetes probes
router.use('/', healthRoutes);

export default router;
