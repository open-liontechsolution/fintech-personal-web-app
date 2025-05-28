'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fix for the tags column to be ARRAY type instead of JSONB
    await queryInterface.removeColumn('transactions', 'tags');
    await queryInterface.addColumn('transactions', 'tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: []
    });

    // Make sure account_id references the accounts table
    // First check if constraint exists and remove it if it does
    try {
      await queryInterface.removeConstraint('transactions', 'transactions_account_id_fkey');
    } catch (error) {
      console.log('Constraint did not exist, continuing...');
    }

    // Add the foreign key constraint
    await queryInterface.addConstraint('transactions', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'transactions_account_id_fkey',
      references: {
        table: 'accounts',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add new indexes for improved performance
    await queryInterface.addIndex('transactions', ['user_id', 'date'], {
      name: 'transactions_user_date_idx'
    });

    await queryInterface.addIndex('transactions', ['account_id', 'date'], {
      name: 'transactions_account_date_idx'
    });

    await queryInterface.addIndex('transactions', ['category_id', 'date'], {
      name: 'transactions_category_date_idx'
    });

    await queryInterface.addIndex('transactions', ['amount', 'date'], {
      name: 'transactions_amount_date_idx'
    });

    await queryInterface.addIndex('transactions', ['status'], {
      name: 'transactions_status_idx'
    });

    // Only add GIN index if PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.addIndex('transactions', ['tags'], {
        name: 'transactions_tags_idx',
        using: 'gin'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('transactions', 'transactions_user_date_idx');
    await queryInterface.removeIndex('transactions', 'transactions_account_date_idx');
    await queryInterface.removeIndex('transactions', 'transactions_category_date_idx');
    await queryInterface.removeIndex('transactions', 'transactions_amount_date_idx');
    await queryInterface.removeIndex('transactions', 'transactions_status_idx');

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.removeIndex('transactions', 'transactions_tags_idx');
    }

    // Remove constraint
    await queryInterface.removeConstraint('transactions', 'transactions_account_id_fkey');

    // Revert tags back to JSONB
    await queryInterface.removeColumn('transactions', 'tags');
    await queryInterface.addColumn('transactions', 'tags', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });
  }
};
