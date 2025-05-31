import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

// Intentar importar el tipo ValidationError desde el paquete común
let ValidationError: any;
try {
  const { ValidationError: VE } = require('fintech-personal-common');
  ValidationError = VE;
} catch (e) {
  // Usar una definición local si no está disponible
  ValidationError = class ValidationError extends Error {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  };
}

class AuthController {
  // Register a new user
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, invitationCode } = req.body;
      
      // Validate required fields
      if (!name || !email || !password || !invitationCode) {
        throw new ValidationError('Name, email, password, and invitation code are required');
      }
      
      // Register user
      const authResponse = await authService.register({
        name,
        email,
        password,
        invitationCode
      });
      
      return res.status(201).json({
        ...authResponse,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Login existing user
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }
      
      // Login user
      const authResponse = await authService.login({
        email,
        password
      });
      
      return res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
  }
  
  // Get current user profile
  public async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      // User is attached to request by auth middleware
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }
      
      return res.status(200).json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Generate invitation code (admin only)
  public async generateInvitationCode(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is an admin (in a real app, you'd have role-based authorization)
      // For simplicity, we'll allow any authenticated user to generate codes
      const { expiresInDays } = req.body;
      
      // Generate invitation code
      const invitationCode = await authService.generateInvitationCode(
        req.user?.id || null,
        expiresInDays ? parseInt(expiresInDays, 10) : undefined
      );
      
      return res.status(201).json({ invitationCode });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        throw new ValidationError('Valid verification token is required');
      }
      
      try {
        // Intentar verificar el email
        await authService.verifyEmail(token);
        
        // Renderizar la página de éxito
        return res.render('email-verified');
      } catch (verificationError: any) {
        // Si hay un error durante la verificación, mostrar página de error
        return res.render('error', { 
          title: 'Error de Verificación', 
          message: 'No se pudo verificar tu correo electrónico. El enlace puede haber caducado o ser inválido.',
          error: verificationError?.message || 'Token inválido o expirado'
        });
      }
    } catch (error) {
      next(error);
    }
  }
  
  // Resend verification email
  public async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      await authService.resendVerificationEmail(email);
      
      // Siempre devolvemos éxito aunque el email no exista (por seguridad)
      return res.status(200).json({ 
        success: true, 
        message: 'If your email is registered and not verified, a new verification email has been sent.' 
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Request password reset
  public async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      await authService.requestPasswordReset(email);
      
      // Siempre devolvemos éxito aunque el email no exista (por seguridad)
      return res.status(200).json({ 
        success: true, 
        message: 'If your email is registered, a password reset link has been sent.' 
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Reset password
  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }
      
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }
      
      await authService.resetPassword(token, newPassword);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Password has been reset successfully. You can now log in with your new password.' 
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
