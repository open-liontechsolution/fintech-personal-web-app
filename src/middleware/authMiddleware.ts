import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

// Definimos una clase de error para autenticación fallida
class UnauthorizedError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    this.code = 'UNAUTHORIZED';
  }
}

// Log para depuración
console.log('[API Auth] UnauthorizedError definido correctamente');

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify JWT token and attach user to request
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token is required');
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token and get user
    const user = await authService.verifyToken(token);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token
      const token = authHeader.split(' ')[1];
      
      // Verify token and get user
      const user = await authService.verifyToken(token);
      if (user) {
        // Attach user to request object
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
