import { Router, Request, Response } from 'express';
import sequelize from '../config/database';

const router = Router();

// Health check endpoint para Kubernetes probes
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar la conexión a la base de datos
    await sequelize.authenticate();
    
    // Si todo está bien, devuelve un 200 OK
    return res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: 'OK',
      server: 'OK'
    });
  } catch (error) {
    // Si hay un error con la base de datos, devuelve un 503 Service Unavailable
    console.error('Health check failed:', error);
    
    // Proper error handling with type checking
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown database error';
      
    return res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: 'ERROR',
      server: 'OK',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Database connection error'
    });
  }
});

export default router;
