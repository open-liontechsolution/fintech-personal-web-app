import { Request, Response, NextFunction } from 'express';
import { InvitationCode, User } from '../models';
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

class InvitationController {
  // Generate invitation code
  public async generateInvitationCode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }
      
      const { expiresInDays } = req.body;
      
      // Generate invitation code
      const invitationCode = await authService.generateInvitationCode(
        req.user.id,
        expiresInDays ? parseInt(expiresInDays, 10) : undefined
      );
      
      return res.status(201).json({ invitationCode });
    } catch (error) {
      next(error);
    }
  }

  // Get all invitation codes created by the current user
  public async getUserInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Find all invitation codes created by the user
      const invitationCodes = await InvitationCode.findAll({
        where: { createdBy: req.user.id },
        order: [['createdAt', 'DESC']],
        include: [
          { 
            model: User, 
            as: 'usedByUser',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Get remaining invitations
      const user = await User.findByPk(req.user.id);
      const remainingInvitations = await user!.getRemainingInvitations();

      return res.status(200).json({
        invitationCodes: invitationCodes.map(code => ({
          id: code.id,
          code: code.code,
          isUsed: code.isUsed,
          usedBy: code.usedByUser ? {
            id: code.usedByUser.id,
            name: code.usedByUser.name,
            email: code.usedByUser.email
          } : null,
          expiresAt: code.expiresAt,
          createdAt: code.createdAt
        })),
        remainingInvitations,
        invitationLimit: user!.invitationLimit
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvitationController();
