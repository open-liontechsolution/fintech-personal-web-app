require('dotenv').config();

// Log environment variables to help diagnose connection issues
if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
  console.log('Database connection parameters:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_SCHEMA: ${process.env.DB_SCHEMA}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
}

// Explicitly prevent use of DATABASE_URL to avoid issues
if (process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable detected but will be ignored');
  delete process.env.DATABASE_URL;
}

module.exports = {
  development: {
    username: process.env.DB_USER || 'fintech_user',
    password: process.env.DB_PASSWORD || 'fintech_password',
    database: process.env.DB_NAME || 'fintech_personal',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'fintech_user',
    password: process.env.DB_PASSWORD || 'fintech_password',
    database: process.env.DB_NAME || 'fintech_personal_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'postgresql-primary.generic.svc.cluster.local',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    // Add logging to troubleshoot connection issues
    logging: process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug'
  }
};

