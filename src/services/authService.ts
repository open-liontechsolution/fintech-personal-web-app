import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import InvitationCode from '../models/InvitationCode';
import logger from '../config/logger';
import emailService from './emailService';

// Definimos interfaces locales para los tipos de datos
interface UserRegistrationDto {
  name: string;
  email: string;
  password: string;
}

interface UserLoginDto {
  email: string;
  password: string;
}

interface AuthResponseDto {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Definimos o cargamos clases de error según disponibilidad del paquete
let AppError: any;
let NotFoundError: any;
let ValidationError: any;

try {
  // Intentar cargar los errores desde el paquete
  const commonPackage = require('fintech-personal-common');
  AppError = commonPackage.AppError;
  NotFoundError = commonPackage.NotFoundError;
  ValidationError = commonPackage.ValidationError;
  logger.debug('Loaded error types from fintech-personal-common');
} catch (e) {
  // Usar nuestras propias definiciones de errores
  logger.warn('fintech-personal-common types not available, using fallback error types');
  
  AppError = class AppError extends Error {
    statusCode: number = 500;
    code: string = 'APP_ERROR';
    
    constructor(message: string) {
      super(message);
      this.name = 'AppError';
    }
  };
  
  NotFoundError = class NotFoundError extends AppError {
    constructor(message: string) {
      super(message);
      this.statusCode = 404;
      this.code = 'NOT_FOUND';
      this.name = 'NotFoundError';
    }
  };
  
  ValidationError = class ValidationError extends AppError {
    constructor(message: string) {
      super(message);
      this.statusCode = 400;
      this.code = 'VALIDATION_ERROR';
      this.name = 'ValidationError';
    }
  };
}

class AuthService {
  // Generate JWT token
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    
    // Creamos un payload con el ID del usuario
    const payload = { userId };
    
    try {
      // Usamos un método alternativo que resuelve los problemas de tipado
      // Convertimos el secreto a Buffer que es compatible con los tipos
      const secretBuffer = Buffer.from(secret, 'utf8');
      
      // Forma alternativa de llamar a jwt.sign que evita problemas de tipado
      // Esto funciona porque todas las cadenas son válidas para expiresIn en tiempo de ejecución
      const options = {};
      Object.defineProperty(options, 'expiresIn', { value: expiresIn });
      
      return jwt.sign(payload, secretBuffer, options);
    } catch (error) {
      logger.error('Error al firmar el token JWT:', error);
      throw new AppError('Error al generar el token de autenticación');
    }
  }

  // Register a new user with invitation code
  public async register(userData: { name: string; email: string; password: string; invitationCode: string }): Promise<AuthResponseDto> {
    // Validate invitation code
    const invitationCode = await InvitationCode.findOne({
      where: { code: userData.invitationCode }
    });

    if (!invitationCode || !invitationCode.isValid()) {
      throw new ValidationError('Invalid or expired invitation code');
    }

    // Check if email is already in use
    const existingUser = await User.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new ValidationError('Email is already in use');
    }

    // Generar token de verificación
    const emailVerificationToken = emailService.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas

    // Create new user
    const user = await User.create({
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpires: expiresAt
    });

    // Mark invitation code as used
    await invitationCode.markAsUsed(user.id);

    // Enviar correo de verificación
    await emailService.sendVerificationEmail(user.email, emailVerificationToken, user.name);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return auth response
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    };
  }

  // Login existing user
  public async login(loginData: { email: string; password: string }): Promise<AuthResponseDto> {
    // Find user by email
    const user = await User.findOne({
      where: { email: loginData.email }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(loginData.password);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid password');
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return auth response
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    };
  }

  // Verify token and get user
  public async verifyToken(token: string): Promise<User | null> {
    try {
      const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
      
      logger.debug(`[Auth Service] Verificando token: ${token.substring(0, 15)}...`);
      
      // Verificar que el token no esté vacío
      if (!token || token.trim() === '') {
        logger.warn('[Auth Service] Se recibió un token vacío para verificación');
        return null;
      }
      
      // Decodificar token JWT
      const decoded = jwt.verify(token, secret) as { userId: string };
      
      if (!decoded || !decoded.userId) {
        logger.warn('[Auth Service] Token decodificado sin userId');
        return null;
      }
      
      logger.debug(`[Auth Service] Token válido para usuario ID: ${decoded.userId}`);
      
      // Buscar el usuario en la base de datos
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        logger.warn(`[Auth Service] No se encontró el usuario con ID: ${decoded.userId}`);
        return null;
      }
      
      return user;
    } catch (error: any) {
      // Capturar y loguear el error específico
      logger.error(`[Auth Service] Error verificando token: ${error?.message || 'Error desconocido'}`);
      return null;
    }
  }

  // Generate new invitation code
  public async generateInvitationCode(createdBy: string | null, expiresInDays?: number): Promise<InvitationCode> {
    // Si tenemos un ID de usuario creador, verificar su límite de invitaciones
    if (createdBy) {
      // Buscar el usuario
      const user = await User.findByPk(createdBy);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Verificar si puede crear más invitaciones
      const canCreate = await user.canCreateInvitation();
      
      if (!canCreate) {
        throw new ValidationError('Invitation limit reached. Maximum of ' + user.invitationLimit + ' invitations allowed.');
      }
    }
    
    // Configurar fecha de expiración
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Usar el método createForUser si hay un usuario creador
    if (createdBy) {
      // Convertimos null a undefined para satisfacer la firma del método
      const expiresAtDate = expiresAt === null ? undefined : expiresAt;
      const invitation = await InvitationCode.createForUser(createdBy, expiresAtDate);
      
      if (!invitation) {
        throw new ValidationError('Could not create invitation code. You may have reached your limit.');
      }
      
      return invitation;
    } else {
      // Para códigos de sistema (sin usuario creador)
      return await InvitationCode.create({
        code: InvitationCode.generateCode(),
        createdBy: null,
        expiresAt
      });
    }
  }

  // Verify email
  public async verifyEmail(token: string): Promise<boolean> {
    // Buscar usuario con este token de verificación
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerified: false
      }
    });

    if (!user) {
      throw new ValidationError('Invalid verification token');
    }

    // Verificar que el token no ha expirado
    if (user.emailVerificationTokenExpires && new Date() > user.emailVerificationTokenExpires) {
      throw new ValidationError('Verification token has expired');
    }

    // Actualizar usuario como verificado
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    // Enviar correo de bienvenida
    await emailService.sendWelcomeEmail(user.email, user.name);

    return true;
  }

  // Request password reset
  public async requestPasswordReset(email: string): Promise<boolean> {
    // Buscar usuario por email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      // No indicamos error para evitar exponer información sobre usuarios existentes
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return false;
    }

    // Generar token de restablecimiento
    const passwordResetToken = emailService.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora

    // Actualizar usuario con token
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = expiresAt;
    await user.save();

    // Enviar correo de restablecimiento
    await emailService.sendPasswordResetEmail(user.email, passwordResetToken, user.name);

    return true;
  }

  // Reset password with token
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Buscar usuario con este token de restablecimiento
    const user = await User.findOne({
      where: {
        passwordResetToken: token
      }
    });

    if (!user) {
      throw new ValidationError('Invalid reset token');
    }

    // Verificar que el token no ha expirado
    if (user.passwordResetTokenExpires && new Date() > user.passwordResetTokenExpires) {
      throw new ValidationError('Reset token has expired');
    }

    // Actualizar contraseña
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    return true;
  }

  // Resend verification email
  public async resendVerificationEmail(email: string): Promise<boolean> {
    // Buscar usuario por email
    const user = await User.findOne({
      where: { 
        email,
        emailVerified: false
      }
    });

    if (!user) {
      logger.info(`Verification email resend requested for verified or non-existent email: ${email}`);
      return false;
    }

    // Generar nuevo token de verificación
    const emailVerificationToken = emailService.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas

    // Actualizar usuario con nuevo token
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = expiresAt;
    await user.save();

    // Enviar correo de verificación
    await emailService.sendVerificationEmail(user.email, emailVerificationToken, user.name);

    return true;
  }
}

export default new AuthService();
