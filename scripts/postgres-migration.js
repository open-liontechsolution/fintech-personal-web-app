/**
 * Script para migrar el esquema de base de datos a PostgreSQL
 * 
 * Este script debe ejecutarse después de cambiar a PostgreSQL para 
 * establecer el esquema correcto y las relaciones entre tablas.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear la conexión a la base de datos PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'fintech_personal',
  process.env.DB_USER || 'fintech_user',
  process.env.DB_PASSWORD || 'fintech_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: console.log,
  }
);

async function migrateDatabase() {
  try {
    // Probar la conexión
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente con PostgreSQL.');

    // Sincronizar todos los modelos definidos
    console.log('Sincronizando modelos...');
    
    // Importamos los modelos 
    const { User, Transaction, InvitationCode } = require('../dist/src/models');
    
    // Configuramos las opciones de sincronización
    const syncOptions = {
      force: true, // ¡CUIDADO! Esto eliminará todas las tablas existentes
      alter: false
    };
    
    // Sincronizamos
    await sequelize.sync(syncOptions);
    
    console.log('Sincronización completada. El esquema ha sido creado/actualizado.');
    
    // Opcionalmente, podemos crear datos de prueba básicos
    if (process.env.CREATE_TEST_DATA === 'true') {
      console.log('Creando datos de prueba...');
      
      // Crear usuario administrador
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('Password123!', 10)
      });
      
      console.log('Usuario de prueba creado:', adminUser.id);
      
      // Crear códigos de invitación
      const invitationCode = await InvitationCode.create({
        code: 'WELCOME',
        createdBy: adminUser.id,
        isUsed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      });
      
      console.log('Código de invitación creado:', invitationCode.code);
    }
    
    console.log('Migración a PostgreSQL completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración a PostgreSQL:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

// Ejecutar la migración
migrateDatabase();
