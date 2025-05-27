import { Router } from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactionRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

export default router;
