'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    // First, create the ENUM type if using PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
          CREATE TYPE fintech.enum_categories_type AS ENUM ('income', 'expense', 'transfer', 'investment');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;`
      ).catch(error => {
        // Log any errors but continue
        console.log('ENUM type creation error:', error);
      });
    }
    
    await queryInterface.createTable({ tableName: 'categories', schema: 'fintech' }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'categories', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      // Campo añadido de la migración 011
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'users', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      // Campo añadido de la migración 011
      type: {
        type: dialect === 'postgres' 
          ? Sequelize.ENUM('income', 'expense', 'transfer', 'investment')
          : Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'expense'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Índices añadidos de la migración 011
    await queryInterface.addIndex(
      { tableName: 'categories', schema: 'fintech' },
      ['user_id'], 
      { name: 'categories_user_id_idx' }
    );
    
    await queryInterface.addIndex(
      { tableName: 'categories', schema: 'fintech' },
      ['type'], 
      { name: 'categories_type_idx' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar primero los índices
    await queryInterface.removeIndex(
      { tableName: 'categories', schema: 'fintech' }, 
      'categories_user_id_idx'
    ).catch(error => console.log('Error al eliminar índice (podría no existir):', error));
    
    await queryInterface.removeIndex(
      { tableName: 'categories', schema: 'fintech' }, 
      'categories_type_idx'
    ).catch(error => console.log('Error al eliminar índice (podría no existir):', error));
    
    await queryInterface.dropTable({ tableName: 'categories', schema: 'fintech' });
    
    // Eliminar tipo ENUM si estamos en PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS fintech.enum_categories_type;`
      ).catch(error => {
        console.log('Error al eliminar tipo ENUM (podría estar en uso):', error);
      });
    }
  }
};
