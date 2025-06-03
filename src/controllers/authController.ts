import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import jwt from 'jsonwebtoken';

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
  // Get token from auth cookie
  public async getToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authToken = req.cookies.authToken;
      
      // Si no hay token, devolver respuesta 200 con authenticated=false en lugar de error 401
      // Esto es más amigable para el cliente JavaScript que sincroniza el token
      if (!authToken) {
        return res.status(200).json({ 
          authenticated: false,
          message: 'No hay sesión activa' 
        });
      }
      
      try {
        // Verify token validity
        const user = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
        
        return res.status(200).json({ 
          authenticated: true,
          token: authToken,
          user: user
        });
      } catch (error) {
        // Token inválido, eliminarlo para evitar problemas
        res.clearCookie('authToken');
        
        // Devolver 200 con información de que no está autenticado
        return res.status(200).json({ 
          authenticated: false, 
          message: 'Token inválido o expirado'
        });
      }
    } catch (error) {
      next(error);
    }
  }
  
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
      
      // Establecer cookie de autenticación
      res.cookie('authToken', authResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
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
  
  // Método de generación de invitaciones movido a invitationController

  // Logout user
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Eliminar la cookie de autenticación
      res.clearCookie('authToken');
      
      // No need to invalidate the token on the server-side as we're using JWT
      // Redireccionar al usuario a la página de login con parámetro no_redirect
      // para prevenir redirecciones en bucle
      return res.redirect('/login?no_redirect=true');
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
        
        // Renderizar la página de éxito (email-verified) que ya no tiene redirección automática
        return res.render('email-verified');
      } catch (verificationError: any) {
        // Si hay un error durante la verificación, mostrar página de error
        return res.render('error', { 
          title: 'Error de Verificación', 
          message: 'No se pudo verificar tu correo electrónico. El enlace puede haber caducado o ser inválido.',
          error: verificationError?.message || 'Token inválido o expirado',
          showLoginButton: true
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
