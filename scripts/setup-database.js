/**
 * Database setup script
 * This script creates the database and runs migrations
 */

const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'fintech_user',
  password: process.env.DB_PASSWORD || 'your_password',
};

// Database name
const dbName = process.env.DB_NAME || 'fintech_personal';

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Create connection without database name
    const connection = await mysql.createConnection(dbConfig);

    // Check if database exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    if (rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('Database created successfully');
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    // Close connection
    await connection.end();

    // Run migrations
    console.log('Running migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });

    // Run seeders
    console.log('Running seeders...');
    execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();
