import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

// Intentamos importar UnauthorizedError, o creamos una versión mínima para pruebas
let UnauthorizedError: any;
try {
  const errorTypes = require('fintech-personal-common');
  UnauthorizedError = errorTypes.UnauthorizedError;
} catch (e) {
  console.warn('UnauthorizedError not available from fintech-personal-common, using fallback');
  UnauthorizedError = class UnauthorizedError extends Error {
    statusCode: number = 401;
    code: string = 'UNAUTHORIZED';
  };
}

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
