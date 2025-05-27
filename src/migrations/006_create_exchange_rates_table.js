'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('exchange_rates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      source_currency: {
        type: Sequelize.CHAR(3),
        allowNull: false
      },
      target_currency: {
        type: Sequelize.CHAR(3),
        allowNull: false
      },
      rate: {
        type: Sequelize.DECIMAL(20, 10),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Origen de la tasa de cambio (API, manual, seed)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Añadir índice compuesto para búsqueda rápida
    await queryInterface.addIndex('exchange_rates', ['source_currency', 'target_currency', 'date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('exchange_rates');
  }
};
