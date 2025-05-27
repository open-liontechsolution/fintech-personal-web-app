'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Solo ejecutar si estamos en entorno de desarrollo local
    if (process.env.NODE_ENV !== 'development' && process.env.SEED_TEST_DATA !== 'true') {
      console.log('Skipping test data seeding - not in development environment or SEED_TEST_DATA not set to true');
      return;
    }

    console.log('Seeding test data for local development...');

    // 1. Crear usuario de prueba
    
    // Verificar si los usuarios de prueba ya existen
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('test@example.com', 'admin@example.com')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    let testUserId, adminUserId;
    
    // Mapear usuarios existentes por correo electrónico
    const existingUsersByEmail = {};
    existingUsers.forEach(user => {
      existingUsersByEmail[user.email] = user.id;
    });
    
    // Si los usuarios ya existen, usar sus IDs, de lo contrario crear nuevos
    testUserId = existingUsersByEmail['test@example.com'] || uuidv4();
    adminUserId = existingUsersByEmail['admin@example.com'] || uuidv4();
    
    // Preparar usuarios para inserción si no existen
    const testUsers = [];
    
    if (!existingUsersByEmail['test@example.com']) {
      testUsers.push({
        id: testUserId,
        name: 'Usuario Prueba',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null
      });
    }
    
    if (!existingUsersByEmail['admin@example.com']) {
      testUsers.push({
        id: adminUserId,
        name: 'Administrador',
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin123!', 10),
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null
      });
    }
    
    // Insertar usuarios solo si hay nuevos para insertar
    if (testUsers.length > 0) {
      await queryInterface.bulkInsert('users', testUsers);
    }

    // 2. Crear cuentas bancarias de prueba
    const accounts = [
      {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Cuenta Corriente',
        balance: 2500.00,
        currency: 'EUR',
        type: 'checking',
        bank_name: 'Banco Ejemplo',
        is_active: true,
        metadata: JSON.stringify({
          account_number_last4: '1234',
          color: '#2196F3'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Cuenta de Ahorros',
        balance: 15000.00,
        currency: 'EUR',
        type: 'savings',
        bank_name: 'Banco Ejemplo',
        is_active: true,
        metadata: JSON.stringify({
          account_number_last4: '5678',
          color: '#4CAF50'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Tarjeta de Crédito',
        balance: -350.00,
        currency: 'EUR',
        type: 'credit_card',
        bank_name: 'Banco Tarjetas',
        is_active: true,
        metadata: JSON.stringify({
          account_number_last4: '9012',
          color: '#F44336',
          credit_limit: 3000
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // 3. Obtener IDs de categorías existentes
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM categories',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Mapear categorías por nombre para facilitar la creación de transacciones
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Si no hay categorías, crear algunas básicas
    if (Object.keys(categoryMap).length === 0) {
      console.log('No se encontraron categorías, creando categorías básicas...');
      // Insertar las categorías definidas en el otro seeder
      await queryInterface.sequelize.query(`
        INSERT INTO categories (id, name, description, color, icon, is_system, created_at, updated_at)
        VALUES 
          ('${uuidv4()}', 'Ingresos', 'Entradas de dinero', '#4CAF50', 'trending_up', true, NOW(), NOW()),
          ('${uuidv4()}', 'Vivienda', 'Gastos relacionados con el hogar', '#2196F3', 'home', true, NOW(), NOW()),
          ('${uuidv4()}', 'Alimentación', 'Gastos en comida', '#FF9800', 'restaurant', true, NOW(), NOW()),
          ('${uuidv4()}', 'Transporte', 'Gastos de transporte', '#3F51B5', 'directions_car', true, NOW(), NOW()),
          ('${uuidv4()}', 'Ocio', 'Entretenimiento', '#E91E63', 'movie', true, NOW(), NOW())
      `);

      // Obtener las categorías recién creadas
      const newCategories = await queryInterface.sequelize.query(
        'SELECT id, name FROM categories',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      newCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
    }

    // 4. Crear transacciones ficticias para los últimos 3 meses
    const transactions = [];
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    
    // Función para generar fecha aleatoria entre dos fechas
    function randomDate(start, end) {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    // Función para generar transacciones de un tipo específico
    function generateTransactions(accountId, categoryName, count, amountRange, descriptionOptions, isIncome = false) {
      const categoryId = categoryMap[categoryName];
      
      for (let i = 0; i < count; i++) {
        const amount = isIncome 
          ? (Math.random() * (amountRange.max - amountRange.min) + amountRange.min).toFixed(2)
          : -(Math.random() * (amountRange.max - amountRange.min) + amountRange.min).toFixed(2);
          
        const description = descriptionOptions[Math.floor(Math.random() * descriptionOptions.length)];
        
        transactions.push({
          id: uuidv4(),
          user_id: testUserId,
          account_id: accountId,
          category_id: categoryId,
          subcategory_id: null,
          amount: amount,
          currency: 'EUR',
          date: randomDate(threeMonthsAgo, today),
          description: description,
          notes: null,
          tags: JSON.stringify(['test', description.split(' ')[0].toLowerCase()]),
          status: 'completed',
          is_recurring: Math.random() > 0.8, // 20% de probabilidad de ser recurrente
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // Generar transacciones para cada cuenta y categoría
    // Cuenta corriente
    generateTransactions(
      accounts[0].id, 
      'Ingresos', 
      3, 
      { min: 1200, max: 3000 }, 
      ['Nómina', 'Transferencia recibida', 'Devolución impuestos'],
      true
    );
    
    generateTransactions(
      accounts[0].id, 
      'Vivienda', 
      3, 
      { min: 600, max: 1200 }, 
      ['Alquiler', 'Hipoteca', 'Seguro hogar']
    );
    
    generateTransactions(
      accounts[0].id, 
      'Alimentación', 
      15, 
      { min: 10, max: 150 }, 
      ['Supermercado', 'Restaurante', 'Café', 'Mercado local', 'Comida rápida']
    );
    
    // Cuenta de ahorros
    generateTransactions(
      accounts[1].id, 
      'Ingresos', 
      2, 
      { min: 1000, max: 5000 }, 
      ['Transferencia recibida', 'Intereses'],
      true
    );
    
    // Tarjeta de crédito
    generateTransactions(
      accounts[2].id, 
      'Ocio', 
      10, 
      { min: 20, max: 200 }, 
      ['Cine', 'Teatro', 'Concierto', 'Suscripción', 'Libros', 'Juegos']
    );
    
    generateTransactions(
      accounts[2].id, 
      'Transporte', 
      8, 
      { min: 10, max: 150 }, 
      ['Gasolina', 'Tren', 'Avión', 'Taxi', 'Metro', 'Peaje']
    );

    // 5. Crear algunos códigos de invitación
    const invitationCodes = [
      {
        id: uuidv4(),
        code: 'WELCOME',
        created_by: adminUserId,
        used_by: null,
        is_used: false,
        expires_at: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'TESTUSER',
        created_by: adminUserId,
        used_by: testUserId,
        is_used: true,
        expires_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insertar todos los datos de prueba en la base de datos
    try {
      // Crear la tabla accounts si no existe
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          name VARCHAR(100) NOT NULL,
          balance DECIMAL(15, 2) NOT NULL,
          currency CHAR(3) NOT NULL,
          type VARCHAR(50) NOT NULL,
          bank_name VARCHAR(100),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      // Modificar la tabla transactions si es necesario para agregar nuevos campos
      await queryInterface.sequelize.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'EUR',
        ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'
      `);

      // Solo insertar usuarios si hay nuevos para insertar
      if (testUsers.length > 0) {
        await queryInterface.bulkInsert('users', testUsers, {});
      }
      
      // Verificar si las cuentas ya existen antes de insertarlas
      const existingAccounts = await queryInterface.sequelize.query(
        `SELECT id FROM accounts WHERE user_id IN (?)`,
        { 
          replacements: [Object.values(existingUsersByEmail).concat(testUserId, adminUserId)],
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      
      if (existingAccounts.length === 0) {
        await queryInterface.bulkInsert('accounts', accounts, {});
      }
      
      // Verificar si los códigos de invitación ya existen
      const existingInvitationCodes = await queryInterface.sequelize.query(
        `SELECT code FROM invitation_codes LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existingInvitationCodes.length === 0) {
        await queryInterface.bulkInsert('invitation_codes', invitationCodes, {});
      }
      
      // Verificar si ya hay transacciones antes de intentar insertar nuevas
      const existingTransactions = await queryInterface.sequelize.query(
        `SELECT COUNT(*) FROM transactions`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      // Solo insertar transacciones si no hay ninguna
      if (parseInt(existingTransactions[0].count) === 0) {
        // Transacciones pueden ser muchas, insertarlas en lotes
        const chunkSize = 100;
        for (let i = 0; i < transactions.length; i += chunkSize) {
          const chunk = transactions.slice(i, i + chunkSize);
          try {
            await queryInterface.bulkInsert('transactions', chunk, {});
          } catch (error) {
            console.error('Error al insertar transacciones:', error.message);
          }
        }
      }

      console.log(`Test data seeded successfully! Created:
      - ${testUsers.length} users
      - ${accounts.length} accounts
      - ${transactions.length} transactions
      - ${invitationCodes.length} invitation codes`);
      
    } catch (error) {
      console.error('Error seeding test data:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    // Solo ejecutar en entorno de desarrollo
    if (process.env.NODE_ENV !== 'development') {
      console.log('Skipping test data cleanup - not in development environment');
      return;
    }

    try {
      // Eliminar todos los datos de prueba
      await queryInterface.bulkDelete('transactions', null, {});
      await queryInterface.bulkDelete('accounts', null, {});
      await queryInterface.bulkDelete('invitation_codes', null, {});
      
      // Eliminar usuarios de prueba por email
      await queryInterface.bulkDelete('users', {
        email: ['test@example.com', 'admin@example.com']
      }, {});
      
      console.log('Test data removed successfully');
    } catch (error) {
      console.error('Error removing test data:', error);
    }
  }
};
