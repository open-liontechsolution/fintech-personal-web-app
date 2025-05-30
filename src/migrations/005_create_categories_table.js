'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
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
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: 'categories', schema: 'fintech' });
  }
};
