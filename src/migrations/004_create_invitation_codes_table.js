// Migration to create the invitation codes table for closed registration
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    await queryInterface.createTable({ tableName: 'invitation_codes', schema: 'fintech' }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'users', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      used_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'users', schema: 'fintech' },
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable({ tableName: 'invitation_codes', schema: 'fintech' });
  }
};
