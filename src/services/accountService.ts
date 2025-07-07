import { Account } from '../models/index';
import logger from '../config/logger';

class AccountService {
  /**
   * Retrieves an account by its ID and validates it belongs to the specified user
   * @param accountId The account ID to retrieve
   * @param userId The user ID who should own the account
   * @returns The account object if found, null otherwise
   */
  async getAccountById(accountId: string, userId: string): Promise<Account | null> {
    try {
      const account = await Account.findOne({
        where: {
          id: accountId,
          userId: userId,
          isActive: true
        }
      });
      
      return account;
    } catch (error) {
      logger.error(`Error fetching account by ID ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all accounts belonging to a specific user
   * @param userId The user ID to get accounts for
   * @returns Array of account objects
   */
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    try {
      const accounts = await Account.findAll({
        where: {
          userId,
          isActive: true
        },
        order: [['name', 'ASC']]
      });
      
      return accounts;
    } catch (error) {
      logger.error(`Error fetching accounts for user ${userId}:`, error);
      throw error;
    }
  }
}

export default new AccountService();
