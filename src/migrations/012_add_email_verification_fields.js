'use strict';

// Importar el helper para usar el esquema fintech
const { wrapMigration } = require('../config/migration-helper');

/**
 * Migración para añadir campos de verificación de email y recuperación de contraseña
 * Esta migración añade los campos necesarios para implementar la verificación de email
 * y la funcionalidad de recuperación de contraseña.
 */
module.exports = wrapMigration({
  up: async (queryInterface, Sequelize) => {
    // Añadir campos a la tabla de usuarios (el helper ya aplica el esquema fintech)
    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('users', 'email_verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'email_verification_token_expires', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'password_reset_token_expires', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    // Opcional: Añadir índices para optimizar las consultas
    await queryInterface.addIndex(
      'users',
      ['email_verification_token'],
      { name: 'users_email_verification_token_idx' }
    );
    await queryInterface.addIndex(
      'users',
      ['password_reset_token'],
      { name: 'users_password_reset_token_idx' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar campos en caso de rollback
    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'email_verification_token');
    await queryInterface.removeColumn('users', 'email_verification_token_expires');
    await queryInterface.removeColumn('users', 'password_reset_token');
    await queryInterface.removeColumn('users', 'password_reset_token_expires');
    
    // Eliminar los índices
    await queryInterface.removeIndex(
      'users',
      'users_email_verification_token_idx'
    );
    await queryInterface.removeIndex(
      'users',
      'users_password_reset_token_idx'
    );
  }
});

