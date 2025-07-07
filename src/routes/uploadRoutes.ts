import { Router } from 'express';
import jwt from 'jsonwebtoken';
import uploadController from '../controllers/uploadController';
import { requireAuth } from '../middleware/authMiddleware';
import { authMiddleware } from '../middleware/viewAuthMiddleware';

const router = Router();

// Página de upload (sin middleware adicional - se maneja globalmente)
router.get('/', uploadController.getUploadPage.bind(uploadController));

// Debug middleware para verificar requests
router.use((req, res, next) => {
  console.log(`[Upload Routes] ${req.method} ${req.path} - Files:`, req.files ? Object.keys(req.files) : 'none');
  console.log(`[Upload Routes] Body:`, req.body);
  next();
});

// Middleware API que no redirige - lógica de auth independiente
const apiAuthMiddleware = (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    console.log(`[API Auth] Usuario autenticado: ${decoded.userId}`);
    next();
  } catch (error) {
    console.log(`[API Auth] Token inválido:`, error instanceof Error ? error.message : 'Unknown error');
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// API endpoints
router.post('/upload', authMiddleware, uploadController.uploadFile.bind(uploadController));
router.get('/processed-transactions', apiAuthMiddleware, uploadController.getProcessedTransactions.bind(uploadController));
router.get('/transactions', apiAuthMiddleware, uploadController.getProcessedTransactions.bind(uploadController)); // Alias
router.get('/uploaded-files', apiAuthMiddleware, uploadController.getUploadedFiles.bind(uploadController));

export default router;
