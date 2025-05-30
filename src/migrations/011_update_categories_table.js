'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    // Primero obtenemos la estructura actual de la tabla
    const tableInfo = await queryInterface.describeTable({ tableName: 'categories', schema: 'fintech' });
    
    // Add the user_id column to categories table if it doesn't exist
    if (!tableInfo.user_id) {
      console.log('Añadiendo columna user_id a categories...');
      await queryInterface.addColumn({ tableName: 'categories', schema: 'fintech' }, 'user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'users', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'CASCADE'
      });
    } else {
      console.log('La columna user_id ya existe en categories, omitiendo...');
    }

    // Add transaction type column
    // First, create the ENUM type if using PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `CREATE TYPE IF NOT EXISTS fintech.enum_categories_type AS ENUM ('income', 'expense', 'transfer', 'investment');`
      ).catch(error => {
        // Type might already exist, which is fine
        console.log('ENUM type creation error (might already exist):', error);
      });
    }

    // Now add the type column if it doesn't exist
    if (!tableInfo.type) {
      console.log('Añadiendo columna type a categories...');
      await queryInterface.addColumn({ tableName: 'categories', schema: 'fintech' }, 'type', {
        type: dialect === 'postgres' 
          ? Sequelize.ENUM('income', 'expense', 'transfer', 'investment')
          : Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'expense'
      });
    } else {
      console.log('La columna type ya existe en categories, omitiendo...');
    }

    // Add indexes to improve query performance
    await queryInterface.addIndex({ tableName: 'categories', schema: 'fintech' }, ['user_id'], {
      name: 'categories_user_id_idx'
    });
    
    await queryInterface.addIndex({ tableName: 'categories', schema: 'fintech' }, ['type'], {
      name: 'categories_type_idx'
    });
    
    // Create compound index for user's categories by type
    await queryInterface.addIndex({ tableName: 'categories', schema: 'fintech' }, ['user_id', 'type'], {
      name: 'categories_user_type_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex({ tableName: 'categories', schema: 'fintech' }, 'categories_user_id_idx');
    await queryInterface.removeIndex({ tableName: 'categories', schema: 'fintech' }, 'categories_type_idx');
    await queryInterface.removeIndex({ tableName: 'categories', schema: 'fintech' }, 'categories_user_type_idx');
    
    // Remove columns
    await queryInterface.removeColumn({ tableName: 'categories', schema: 'fintech' }, 'type');
    await queryInterface.removeColumn({ tableName: 'categories', schema: 'fintech' }, 'user_id');
    
    // Drop the ENUM type if PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS fintech.enum_categories_type;`
      ).catch(error => {
        console.log('Error dropping ENUM type:', error);
      });
    }
  }
};
