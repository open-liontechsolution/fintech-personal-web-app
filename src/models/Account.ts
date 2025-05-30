import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// Interface for Account attributes
interface AccountAttributes {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';
  institution: string | null;
  accountNumber: string | null; // Stored masked/encrypted
  balance: number;
  currency: string;
  isActive: boolean;
  color: string | null;
  icon: string | null;
  lastSync: Date | null;
  notes: string | null;
  metadata: any | null; // For any additional data
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Account creation attributes
interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'createdAt' | 'updatedAt' | 'institution' | 'accountNumber' | 'color' | 'icon' | 'lastSync' | 'notes' | 'metadata' | 'isActive'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public type!: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';
  public institution!: string | null;
  public accountNumber!: string | null;
  public balance!: number;
  public currency!: string;
  public isActive!: boolean;
  public color!: string | null;
  public icon!: string | null;
  public lastSync!: Date | null;
  public notes!: string | null;
  public metadata!: any | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Method to calculate balance in a different currency
  public async getBalanceInCurrency(targetCurrency: string): Promise<number> {
    // Implementation would use ExchangeRate model
    // For now, return the same balance
    if (this.currency === targetCurrency) {
      return this.balance;
    }
    
    // Import dynamically to avoid circular dependency
    const { ExchangeRate } = require('./index');
    const rate = await ExchangeRate.getLatestRate(this.currency, targetCurrency);
    
    if (!rate) {
      throw new Error(`No exchange rate found for ${this.currency} to ${targetCurrency}`);
    }
    
    return this.balance * rate.rate;
  }

  // Method to update balance based on transactions
  public async recalculateBalance(): Promise<void> {
    // Import dynamically to avoid circular dependency
    const { Transaction } = require('./index');
    
    const transactions = await Transaction.findAll({
      where: {
        accountId: this.id,
        status: 'completed'
      }
    });
    
    // Calculate balance based on transactions
    let calculatedBalance = 0;
    for (const transaction of transactions) {
      calculatedBalance += transaction.amount;
    }
    
    this.balance = calculatedBalance;
    await this.save();
  }
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la cuenta no puede estar vacío' }
      }
    },
    type: {
      type: DataTypes.ENUM('checking', 'savings', 'credit', 'investment', 'cash', 'other'),
      allowNull: false,
      defaultValue: 'checking'
    },
    institution: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'account_number',
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: true
      }
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'EUR',
      validate: {
        isIn: [['EUR', 'USD', 'GBP']] // Supported currencies
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    color: {
      type: DataTypes.STRING(7), // Hex format #RRGGBB
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_sync',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'accounts',
    schema: process.env.DB_SCHEMA || 'fintech',
    modelName: 'Account',
    underscored: true,
    indexes: [
      // Index for quick lookup by user
      {
        name: 'accounts_user_id_idx',
        fields: ['user_id'],
      },
      // Index for filtering by type
      {
        name: 'accounts_type_idx',
        fields: ['type'],
      },
      // Index for filtering by activity status
      {
        name: 'accounts_is_active_idx',
        fields: ['is_active'],
      },
      // Index for full text search on account name
      {
        name: 'accounts_name_idx',
        fields: ['name'],
      },
      // Composite index for currency grouping
      {
        name: 'accounts_user_currency_idx',
        fields: ['user_id', 'currency'],
      }
    ]
  }
);

// Define association with User
Account.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

export default Account;
