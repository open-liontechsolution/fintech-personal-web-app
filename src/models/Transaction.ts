import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';
import Category from './Category';
import Account from './Account';

// Interface for Transaction attributes
interface TransactionAttributes {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  amount: number;
  currency: string;
  date: Date;
  description: string | null;
  notes: string | null;
  isRecurring: boolean;
  tags: string[] | null;
  location: any | null; // Para coordenadas geográficas
  status: 'pending' | 'completed' | 'reconciled';
  createdAt: Date;
  updatedAt: Date;
  importId: string | null;
  metadata: any | null; // Campo adicional para metadatos flexibles
}

// Interface for Transaction creation attributes
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'isRecurring' | 'importId' | 'categoryId' | 'subcategoryId' | 'description' | 'tags' | 'location' | 'metadata'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public userId!: string;
  public accountId!: string;
  public categoryId!: string | null;
  public subcategoryId!: string | null;
  public amount!: number;
  public currency!: string;
  public date!: Date;
  public description!: string | null;
  public notes!: string | null;
  public isRecurring!: boolean;
  public tags!: string[] | null;
  public location!: any | null;
  public status!: 'pending' | 'completed' | 'reconciled';
  public createdAt!: Date;
  public updatedAt!: Date;
  public importId!: string | null;
  public metadata!: any | null;
  
  // Método para obtener el valor en otra moneda
  public async getAmountInCurrency(targetCurrency: string): Promise<number> {
    if (this.currency === targetCurrency) {
      return this.amount;
    }
    
    // Import dynamically to avoid circular dependency
    const { ExchangeRate } = require('./index');
    const rate = await ExchangeRate.getLatestRate(this.currency, targetCurrency);
    
    if (!rate) {
      throw new Error(`No exchange rate found for ${this.currency} to ${targetCurrency}`);
    }
    
    return this.amount * rate.rate;
  }
  
  // Método para categorizar automáticamente la transacción
  public async categorize(): Promise<void> {
    // Implementación futura: algoritmo de categorización basado en descripción
    if (!this.categoryId && this.description) {
      // Lógica para asignar categoría basada en palabras clave
      // Por ahora dejamos esto como un método de extensión
    }
  }
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
      field: 'subcategory_id'
      // Eliminamos la referencia a subcategories temporalmente
      // hasta que la tabla exista
      // references: {
      //   model: 'subcategories',
      //   key: 'id'
      // }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        notNull: { msg: 'El monto no puede ser nulo' }
      }
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'EUR',
      validate: {
        isIn: [['EUR', 'USD', 'GBP']] // Monedas soportadas
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notNull: { msg: 'La fecha no puede ser nula' }
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'reconciled'),
      allowNull: false,
      defaultValue: 'completed',
      validate: {
        isIn: [['pending', 'completed', 'reconciled']]
      }
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    modelName: 'Transaction',
    underscored: true,
    indexes: [
      // Index for user's transaction timeline
      {
        name: 'transactions_user_date_idx',
        fields: ['user_id', 'date']
      },
      // Index for account transaction history
      {
        name: 'transactions_account_date_idx',
        fields: ['account_id', 'date']
      },
      // Index for financial reporting by category
      {
        name: 'transactions_category_date_idx',
        fields: ['category_id', 'date']
      },
      // Index for amount-based queries and reporting
      {
        name: 'transactions_amount_date_idx',
        fields: ['amount', 'date']
      },
      // Index for status filtering
      {
        name: 'transactions_status_idx',
        fields: ['status']
      },
      // Index for tags searching
      {
        name: 'transactions_tags_idx',
        fields: ['tags'],
        using: 'gin'
      }
    ],
  }
);

// Define associations
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Transaction.belongsTo(Category, { foreignKey: 'subcategoryId', as: 'subcategory' });
Transaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

export default Transaction;
