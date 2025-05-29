import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import InvitationCode from '../models/InvitationCode';
import logger from '../config/logger';

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
    
    // En lugar de establecer expiresIn directamente, lo pasamos como tercer argumento en sign()
    return jwt.sign({ userId }, secret, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1d' 
    });
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

    // Create new user
    const user = await User.create({
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: userData.password
    });

    // Mark invitation code as used
    await invitationCode.markAsUsed(user.id);

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
      const decoded = jwt.verify(token, secret) as { userId: string };
      
      return await User.findByPk(decoded.userId);
    } catch (error) {
      return null;
    }
  }

  // Generate new invitation code
  public async generateInvitationCode(createdBy: string | null, expiresInDays?: number): Promise<InvitationCode> {
    const code = InvitationCode.generateCode();
    
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    return await InvitationCode.create({
      code,
      createdBy,
      expiresAt
    });
  }
}

export default new AuthService();
