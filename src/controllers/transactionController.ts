import { Request, Response, NextFunction } from 'express';
import transactionService from '../services/transactionService';
import { ValidationError } from 'fintech-personal-common';

class TransactionController {
  // Get all transactions for the current user
  public async getUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      // Extract filters from query params
      const filters: any = {};
      
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount as string);
      if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount as string);
      if (req.query.description) filters.description = req.query.description as string;
      
      // Get transactions with pagination
      const result = await transactionService.getUserTransactions(userId, page, limit, filters);
      
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Get a specific transaction
  public async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      const transactionId = req.params.id;
      if (!transactionId) {
        throw new ValidationError('Transaction ID is required');
      }
      
      const transaction = await transactionService.getTransaction(transactionId, userId);
      
      return res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
  }
  
  // Create a new transaction
  public async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      const { accountId, amount, date, description, categoryId, subcategoryId, notes, isRecurring } = req.body;
      
      // Validate required fields
      if (!accountId || amount === undefined || !date) {
        throw new ValidationError('Account ID, amount, and date are required');
      }
      
      // Create transaction
      const transaction = await transactionService.createTransaction({
        userId,
        accountId,
        amount,
        date: new Date(date),
        description,
        categoryId,
        subcategoryId,
        notes,
        isRecurring: isRecurring || false
      });
      
      return res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
  }
  
  // Update a transaction
  public async updateTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      const transactionId = req.params.id;
      if (!transactionId) {
        throw new ValidationError('Transaction ID is required');
      }
      
      const { accountId, amount, date, description, categoryId, subcategoryId, notes, isRecurring } = req.body;
      
      // Update transaction
      const transaction = await transactionService.updateTransaction(transactionId, userId, {
        accountId,
        amount,
        date: date ? new Date(date) : undefined,
        description,
        categoryId,
        subcategoryId,
        notes,
        isRecurring
      });
      
      return res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
  }
  
  // Delete a transaction
  public async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      const transactionId = req.params.id;
      if (!transactionId) {
        throw new ValidationError('Transaction ID is required');
      }
      
      const result = await transactionService.deleteTransaction(transactionId, userId);
      
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Get transaction summary/statistics
  public async getTransactionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }
      
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
      
      const summary = await transactionService.getTransactionSummary(userId, period);
      
      return res.status(200).json({ summary });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
