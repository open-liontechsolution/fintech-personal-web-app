import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger';

// Load environment variables
dotenv.config();

// Create Sequelize instance with database connection details
const sequelize = new Sequelize(
  process.env.DB_NAME || 'fintech_personal',
  process.env.DB_USER || 'fintech_user',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: (sql) => {
      // Solo log de SQL en nivel debug
      logger.debug(sql);
    },
    schema: process.env.DB_SCHEMA || 'fintech',
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch((err) => {
    logger.error('Unable to connect to the database:', err);
  });

export default sequelize;
