import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getUserAccounts, getAccountById, createAccount, updateAccount, deleteAccount } from '../controllers/accountController';

const router = Router();

// Todas las rutas usan el middleware de protección
router.use(requireAuth);

// Rutas de cuentas
router.get('/', getUserAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
