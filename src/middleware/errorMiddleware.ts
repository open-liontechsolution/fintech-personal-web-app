import { Request, Response, NextFunction } from 'express';
// Importamos los tipos de error, pero los hacemos opcionales para entorno de pruebas
let AppError: any, ValidationError: any, NotFoundError: any, UnauthorizedError: any;
try {
  const errorTypes = require('fintech-personal-common');
  AppError = errorTypes.AppError;
  ValidationError = errorTypes.ValidationError;
  NotFoundError = errorTypes.NotFoundError;
  UnauthorizedError = errorTypes.UnauthorizedError;
} catch (e) {
  console.warn('Fintech-personal-common error types not available, using fallbacks');
  // Definimos versiones mínimas para entorno de pruebas
  AppError = class AppError extends Error {
    statusCode: number = 500;
    code: string = 'APP_ERROR';
  };
  ValidationError = class ValidationError extends AppError {};
  NotFoundError = class NotFoundError extends AppError {};
  UnauthorizedError = class UnauthorizedError extends AppError {};
}

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Verificamos si los tipos de error están disponibles antes de usar instanceof
  if (ValidationError && err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR'
      }
    });
  }

  if (NotFoundError && err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        message: err.message,
        code: 'NOT_FOUND'
      }
    });
  }

  if (UnauthorizedError && err instanceof UnauthorizedError) {
    return res.status(401).json({
      error: {
        message: err.message,
        code: 'UNAUTHORIZED'
      }
    });
  }

  if (AppError && err instanceof AppError) {
    return res.status((err as any).statusCode || 500).json({
      error: {
        message: err.message,
        code: (err as any).code || 'APP_ERROR'
      }
    });
  }

  // Default to 500 internal server error for unhandled errors
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};

// Not found middleware for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route not found: ${req.originalUrl}`);
  next(error);
};
