import { Router } from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactionRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

// Health checks para Kubernetes probes
router.use('/', healthRoutes);

export default router;
