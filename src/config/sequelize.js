require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'fintech_user',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'fintech_personal',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: console.log,
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  test: {
    username: process.env.TEST_DB_USER || 'fintech_user',
    password: process.env.TEST_DB_PASSWORD || 'your_password',
    database: process.env.TEST_DB_NAME || 'fintech_personal_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
};
