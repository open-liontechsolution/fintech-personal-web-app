'use strict';

/**
 * Helper para migraciones que asegura que todas las operaciones
 * se realicen en el esquema fintech
 */

// Función para modificar las opciones de tabla para incluir el esquema fintech
const withFintechSchema = (tableNameOrOptions) => {
  if (typeof tableNameOrOptions === 'string') {
    return { tableName: tableNameOrOptions, schema: 'fintech' };
  } else if (tableNameOrOptions && typeof tableNameOrOptions === 'object') {
    return { ...tableNameOrOptions, schema: 'fintech' };
  }
  return tableNameOrOptions;
};

// Sobrescribe los métodos de QueryInterface para usar automáticamente el esquema fintech
const wrapQueryInterfaceWithSchema = (queryInterface) => {
  // Guardamos las implementaciones originales
  const originalCreateTable = queryInterface.createTable;
  const originalAddColumn = queryInterface.addColumn;
  const originalRemoveColumn = queryInterface.removeColumn;
  const originalAddIndex = queryInterface.addIndex;
  const originalRemoveIndex = queryInterface.removeIndex;
  const originalDropTable = queryInterface.dropTable;

  // Sobrescribimos con versiones que usan el esquema fintech
  queryInterface.createTable = function(tableName, attributes, options = {}) {
    return originalCreateTable.call(
      this, 
      withFintechSchema(tableName), 
      attributes, 
      options
    );
  };

  queryInterface.addColumn = function(table, key, attribute) {
    return originalAddColumn.call(
      this, 
      withFintechSchema(table), 
      key, 
      attribute
    );
  };

  queryInterface.removeColumn = function(tableNameOrOptions, attributeName) {
    return originalRemoveColumn.call(
      this, 
      withFintechSchema(tableNameOrOptions), 
      attributeName
    );
  };

  queryInterface.addIndex = function(tableNameOrOptions, attributes, options = {}) {
    return originalAddIndex.call(
      this, 
      withFintechSchema(tableNameOrOptions), 
      attributes, 
      options
    );
  };

  queryInterface.removeIndex = function(tableNameOrOptions, indexNameOrAttributes) {
    return originalRemoveIndex.call(
      this, 
      withFintechSchema(tableNameOrOptions), 
      indexNameOrAttributes
    );
  };

  queryInterface.dropTable = function(tableNameOrOptions, options = {}) {
    return originalDropTable.call(
      this, 
      withFintechSchema(tableNameOrOptions), 
      options
    );
  };

  return queryInterface;
};

// Función para envolver un objeto de migración
const wrapMigration = (migration) => {
  const originalUp = migration.up;
  const originalDown = migration.down;

  migration.up = async (queryInterface, Sequelize, ...args) => {
    // Aseguramos que el esquema existe antes de cualquier operación
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    // Envolvemos el queryInterface
    const wrappedQueryInterface = wrapQueryInterfaceWithSchema(queryInterface);
    
    // Ejecutamos la migración original con el queryInterface modificado
    return originalUp(wrappedQueryInterface, Sequelize, ...args);
  };

  migration.down = async (queryInterface, Sequelize, ...args) => {
    // Envolvemos el queryInterface para el rollback
    const wrappedQueryInterface = wrapQueryInterfaceWithSchema(queryInterface);
    
    // Ejecutamos el rollback original con el queryInterface modificado
    return originalDown(wrappedQueryInterface, Sequelize, ...args);
  };

  return migration;
};

module.exports = {
  wrapMigration,
  withFintechSchema
};
