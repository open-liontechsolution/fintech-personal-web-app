import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Interface for ExchangeRate attributes
interface ExchangeRateAttributes {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  date: Date;
  source: string; // Fuente de la tasa (API, manual, etc.)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for ExchangeRate creation attributes
interface ExchangeRateCreationAttributes extends Optional<ExchangeRateAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

class ExchangeRate extends Model<ExchangeRateAttributes, ExchangeRateCreationAttributes> implements ExchangeRateAttributes {
  public id!: string;
  public sourceCurrency!: string;
  public targetCurrency!: string;
  public rate!: number;
  public date!: Date;
  public source!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Método para convertir un monto entre monedas
  public convert(amount: number): number {
    return amount * this.rate;
  }

  // Método para obtener la tasa inversa
  public getInverseRate(): number {
    return 1 / this.rate;
  }

  // Método estático para obtener la tasa más reciente
  public static async getLatestRate(sourceCurrency: string, targetCurrency: string): Promise<ExchangeRate | null> {
    return ExchangeRate.findOne({
      where: {
        sourceCurrency,
        targetCurrency,
        isActive: true
      },
      order: [['date', 'DESC']]
    });
  }
}

ExchangeRate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    sourceCurrency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      field: 'source_currency',
      validate: {
        isIn: [['EUR', 'USD', 'GBP']] // Mismas monedas que soportamos en transacciones
      }
    },
    targetCurrency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      field: 'target_currency',
      validate: {
        isIn: [['EUR', 'USD', 'GBP']]
      }
    },
    rate: {
      type: DataTypes.DECIMAL(20, 10), // Alta precisión para tasas de cambio
      allowNull: false,
      validate: {
        isGreaterThanZero(value: number) {
          if (value <= 0) {
            throw new Error('La tasa de cambio debe ser mayor que cero');
          }
        }
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'manual',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'exchange_rates',
    modelName: 'ExchangeRate',
    underscored: true,
    indexes: [
      // Índice compuesto para búsquedas por par de monedas
      {
        name: 'exchange_rates_currency_pair_idx',
        fields: ['source_currency', 'target_currency'],
      },
      // Índice para búsquedas por fecha
      {
        name: 'exchange_rates_date_idx',
        fields: ['date'],
      },
      // Índice para optimizar búsqueda de tasas activas
      {
        name: 'exchange_rates_active_idx',
        fields: ['is_active'],
      }
    ]
  }
);

export default ExchangeRate;
