'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    // Fix for the tags column to be ARRAY type instead of JSONB
    await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags');
    await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: []
    });

    // Make sure account_id references the accounts table
    // First check if constraint exists and remove it if it does
    try {
      await queryInterface.removeConstraint({ tableName: 'transactions', schema: 'fintech' }, 'transactions_account_id_fkey');
    } catch (error) {
      console.log('Constraint did not exist, continuing...');
    }

    // Add the foreign key constraint
    await queryInterface.addConstraint({ tableName: 'transactions', schema: 'fintech' }, {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'transactions_account_id_fkey',
      references: {
        table: { tableName: 'accounts', schema: 'fintech' },
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add new indexes for improved performance
    await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['user_id', 'date'], {
      name: 'transactions_user_date_idx'
    });

    await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['account_id', 'date'], {
      name: 'transactions_account_date_idx'
    });

    await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['category_id', 'date'], {
      name: 'transactions_category_date_idx'
    });

    await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['amount', 'date'], {
      name: 'transactions_amount_date_idx'
    });

    await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['status'], {
      name: 'transactions_status_idx'
    });

    // Only add GIN index if PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.addIndex({ tableName: 'transactions', schema: 'fintech' }, ['tags'], {
        name: 'transactions_tags_idx',
        using: 'gin'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_user_date_idx');
    await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_account_date_idx');
    await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_category_date_idx');
    await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_amount_date_idx');
    await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_status_idx');

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.removeIndex({ tableName: 'transactions', schema: 'fintech' }, 'transactions_tags_idx');
    }

    // Remove constraint
    await queryInterface.removeConstraint({ tableName: 'transactions', schema: 'fintech' }, 'transactions_account_id_fkey');

    // Revert tags back to JSONB
    await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags');
    await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });
  }
};
