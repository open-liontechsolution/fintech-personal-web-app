import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// Interface for Transaction attributes
interface TransactionAttributes {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  amount: number;
  date: Date;
  description: string | null;
  notes: string | null;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  importId: string | null;
}

// Interface for Transaction creation attributes
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'isRecurring' | 'importId' | 'categoryId' | 'subcategoryId' | 'description'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public userId!: string;
  public accountId!: string;
  public categoryId!: string | null;
  public subcategoryId!: string | null;
  public amount!: number;
  public date!: Date;
  public description!: string | null;
  public notes!: string | null;
  public isRecurring!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public importId!: string | null;
}

Transaction.init(
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
      }
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'account_id',
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    subcategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'subcategory_id',
      references: {
        model: 'subcategories',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring',
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
    importId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'import_id',
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    modelName: 'Transaction',
    underscored: true,
  }
);

// Define associations
Transaction.belongsTo(User, { foreignKey: 'userId' });

export default Transaction;
