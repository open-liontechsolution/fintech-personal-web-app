import Transaction from '../models/Transaction';
import { Op } from 'sequelize';
import { NotFoundError } from 'fintech-personal-common';

class TransactionService {
  // Get all transactions for a user
  public async getUserTransactions(userId: string, page = 1, limit = 20, filters: any = {}) {
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions: any = { userId };
    
    if (filters.startDate && filters.endDate) {
      whereConditions.date = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    } else if (filters.startDate) {
      whereConditions.date = {
        [Op.gte]: filters.startDate
      };
    } else if (filters.endDate) {
      whereConditions.date = {
        [Op.lte]: filters.endDate
      };
    }
    
    if (filters.categoryId) {
      whereConditions.categoryId = filters.categoryId;
    }
    
    if (filters.minAmount && filters.maxAmount) {
      whereConditions.amount = {
        [Op.between]: [filters.minAmount, filters.maxAmount]
      };
    } else if (filters.minAmount) {
      whereConditions.amount = {
        [Op.gte]: filters.minAmount
      };
    } else if (filters.maxAmount) {
      whereConditions.amount = {
        [Op.lte]: filters.maxAmount
      };
    }
    
    if (filters.description) {
      whereConditions.description = {
        [Op.like]: `%${filters.description}%`
      };
    }
    
    // Query with pagination
    const { rows, count } = await Transaction.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['date', 'DESC']],
    });
    
    return {
      transactions: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  }
  
  // Get a specific transaction
  public async getTransaction(id: string, userId: string) {
    const transaction = await Transaction.findOne({
      where: { id, userId }
    });
    
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    
    return transaction;
  }
  
  // Create a new transaction
  public async createTransaction(transactionData: any) {
    return await Transaction.create(transactionData);
  }
  
  // Update a transaction
  public async updateTransaction(id: string, userId: string, transactionData: any) {
    const transaction = await this.getTransaction(id, userId);
    
    Object.assign(transaction, transactionData);
    await transaction.save();
    
    return transaction;
  }
  
  // Delete a transaction
  public async deleteTransaction(id: string, userId: string) {
    const transaction = await this.getTransaction(id, userId);
    
    await transaction.destroy();
    
    return { success: true };
  }
  
  // Get transaction summary/statistics for a user
  public async getTransactionSummary(userId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    // Get all transactions for the period
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalExpense = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
    
    return {
      period,
      startDate,
      endDate,
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }
}

export default new TransactionService();
