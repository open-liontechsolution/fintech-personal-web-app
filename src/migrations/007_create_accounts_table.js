'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('checking', 'savings', 'credit', 'investment', 'cash', 'other'),
        allowNull: false,
        defaultValue: 'checking'
      },
      institution: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      account_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'EUR'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
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

    // Add indexes to improve query performance
    await queryInterface.addIndex('accounts', ['user_id'], {
      name: 'accounts_user_id_idx'
    });
    
    await queryInterface.addIndex('accounts', ['type'], {
      name: 'accounts_type_idx'
    });
    
    await queryInterface.addIndex('accounts', ['is_active'], {
      name: 'accounts_is_active_idx'
    });
    
    await queryInterface.addIndex('accounts', ['name'], {
      name: 'accounts_name_idx'
    });
    
    await queryInterface.addIndex('accounts', ['user_id', 'currency'], {
      name: 'accounts_user_currency_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('accounts');
  }
};
