// Migration to create the users table with all required fields
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    await queryInterface.createTable({ tableName: 'users', schema: 'fintech' }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      // Campos para verificación de email (antes en 012_add_email_verification_fields.js)
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_verification_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Campos para recuperación de contraseña (antes en 012_add_email_verification_fields.js)
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Campo para límite de invitaciones (antes en 012_add_invitation_limit_to_users.js)
      invitation_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false
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
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
    
    // Crear índices para mejorar el rendimiento de las consultas
    await queryInterface.addIndex(
      { tableName: 'users', schema: 'fintech' },
      ['email_verification_token'],
      { name: 'users_email_verification_token_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'users', schema: 'fintech' },
      ['password_reset_token'],
      { name: 'users_password_reset_token_idx' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar índices antes de eliminar la tabla
    await queryInterface.removeIndex(
      { tableName: 'users', schema: 'fintech' }, 
      'users_email_verification_token_idx'
    ).catch(err => console.log('Índice no encontrado, continuando...'));
    
    await queryInterface.removeIndex(
      { tableName: 'users', schema: 'fintech' }, 
      'users_password_reset_token_idx'
    ).catch(err => console.log('Índice no encontrado, continuando...'));
    
    await queryInterface.dropTable({ tableName: 'users', schema: 'fintech' });
  }
};
