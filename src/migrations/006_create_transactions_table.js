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
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      concept: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: 'transactions', schema: 'fintech' });
  }
};
