'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    await queryInterface.createTable({ tableName: 'transactions', schema: 'fintech' }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      // Campo que antes estaba en la migración 009
      account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID de la cuenta asociada a la transacción'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      // Campo que antes estaba en la migración 009
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'EUR'
      },
      concept: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      // Campo que antes estaba en la migración 009
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      // Campo que antes estaba en la migración 009
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      // Campo que antes estaba en la migración 009
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'categories', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      // Campo que antes estaba en la migración 009
      subcategory_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      // Campo que antes estaba en la migración 009
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      // Campo que antes estaba en la migración 009
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      // Campo que antes estaba en la migración 009
      location: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      // Campo que antes estaba en la migración 009
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'reconciled'),
        allowNull: false,
        defaultValue: 'completed'
      },
      // Campo adicional de la migración 009
      import_id: {
        type: Sequelize.UUID,
        allowNull: true,
        description: 'ID de la importación que generó esta transacción'
      },
      // Campo que antes estaba en la migración 009
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
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
    
    // Índices que antes estaban en la migración 010
    // Índice para mejorar la búsqueda por fecha
    await queryInterface.addIndex(
      { tableName: 'transactions', schema: 'fintech' },
      ['date'],
      { name: 'idx_transactions_date' }
    );
    
    // Índice para mejorar la búsqueda por usuario + fecha
    await queryInterface.addIndex(
      { tableName: 'transactions', schema: 'fintech' },
      ['user_id', 'date'],
      { name: 'idx_transactions_user_date' }
    );
    
    // Índice para mejorar la búsqueda por categoría
    await queryInterface.addIndex(
      { tableName: 'transactions', schema: 'fintech' },
      ['category_id'],
      { name: 'idx_transactions_category' }
    );
    
    // Índice para mejorar la búsqueda por cuenta
    await queryInterface.addIndex(
      { tableName: 'transactions', schema: 'fintech' },
      ['account_id'],
      { name: 'idx_transactions_account' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar los índices antes de eliminar la tabla
    await queryInterface.removeIndex(
      { tableName: 'transactions', schema: 'fintech' },
      'idx_transactions_date'
    ).catch(err => console.log('Índice no encontrado, continuando...'));

    await queryInterface.removeIndex(
      { tableName: 'transactions', schema: 'fintech' },
      'idx_transactions_user_date'
    ).catch(err => console.log('Índice no encontrado, continuando...'));

    await queryInterface.removeIndex(
      { tableName: 'transactions', schema: 'fintech' },
      'idx_transactions_category'
    ).catch(err => console.log('Índice no encontrado, continuando...'));

    await queryInterface.removeIndex(
      { tableName: 'transactions', schema: 'fintech' },
      'idx_transactions_account'
    ).catch(err => console.log('Índice no encontrado, continuando...'));
    
    await queryInterface.dropTable({ tableName: 'transactions', schema: 'fintech' });
  }
};
