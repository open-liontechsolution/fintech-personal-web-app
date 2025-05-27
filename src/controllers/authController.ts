import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { ValidationError } from 'fintech-personal-common';

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
      
      return res.status(201).json(authResponse);
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
}

export default new AuthController();
