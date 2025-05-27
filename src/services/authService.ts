import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import InvitationCode from '../models/InvitationCode';
// Intentamos importar los tipos desde fintech-personal-common o creamos versiones simples para pruebas
let UserRegistrationDto: any, UserLoginDto: any, AuthResponseDto: any;
let AppError: any, NotFoundError: any, ValidationError: any;

try {
  const commonTypes = require('fintech-personal-common');
  UserRegistrationDto = commonTypes.UserRegistrationDto;
  UserLoginDto = commonTypes.UserLoginDto;
  AuthResponseDto = commonTypes.AuthResponseDto;
  AppError = commonTypes.AppError;
  NotFoundError = commonTypes.NotFoundError;
  ValidationError = commonTypes.ValidationError;
} catch (e) {
  console.warn('fintech-personal-common types not available, using simple objects for testing');
  
  // Definimos versiones básicas para pruebas
  AppError = class AppError extends Error {
    statusCode: number = 500;
    code: string = 'APP_ERROR';
  };
  NotFoundError = class NotFoundError extends AppError {};
  ValidationError = class ValidationError extends AppError {};
}

class AuthService {
  // Generate JWT token
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    
    // Corregimos el manejo de expiresIn para evitar problemas de tipo
    const options: jwt.SignOptions = {};
    if (process.env.JWT_EXPIRES_IN) {
      options.expiresIn = process.env.JWT_EXPIRES_IN;
    } else {
      options.expiresIn = '1d';
    }
    
    return jwt.sign({ userId }, secret, options);
  }

  // Register a new user with invitation code
  public async register(userData: UserRegistrationDto & { invitationCode: string }): Promise<AuthResponseDto> {
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
  public async login(loginData: UserLoginDto): Promise<AuthResponseDto> {
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
