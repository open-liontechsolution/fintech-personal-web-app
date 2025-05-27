import { Router } from 'express';
import transactionController from '../controllers/transactionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// All transaction routes require authentication
router.use(requireAuth);

// Transaction routes
router.get('/', transactionController.getUserTransactions);
router.get('/summary', transactionController.getTransactionSummary);
router.get('/:id', transactionController.getTransaction);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
