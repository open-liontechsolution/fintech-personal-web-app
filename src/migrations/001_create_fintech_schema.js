'use strict';

/**
 * Migración para crear el esquema fintech y establecerlo como predeterminado
 * Esta migración debe ejecutarse antes que todas las demás para garantizar 
 * que el esquema fintech exista para todas las tablas.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Crear el esquema fintech si no existe
      await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
      
      // Establecer el esquema de búsqueda por defecto a nivel de base de datos
      await queryInterface.sequelize.query('ALTER DATABASE fintech_personal SET search_path TO fintech, public;');
      
      // Establecer el esquema de búsqueda por defecto para la sesión actual
      await queryInterface.sequelize.query('SET search_path TO fintech, public;');
      
      // Mover cualquier tabla existente de public a fintech
      // Obtener todas las tablas en el esquema public excepto las de sistema
      const [tables] = await queryInterface.sequelize.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('SequelizeMeta');"
      );
      
      // Si existen tablas en public (excepto SequelizeMeta), mostrar advertencia
      if (tables.length > 0) {
        console.log('⚠️ Advertencia: Existen tablas en el esquema public. Considere moverlas manualmente a fintech.');
        tables.forEach(table => {
          console.log(`   - ${table.tablename}`);
        });
      }
      
      console.log('✅ Esquema fintech creado y establecido como predeterminado');
    } catch (error) {
      console.error('❌ Error al configurar el esquema fintech:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No se elimina el esquema en el rollback para evitar pérdida de datos accidental
    // Simplemente restablecemos el esquema de búsqueda por defecto
    await queryInterface.sequelize.query('ALTER DATABASE fintech_personal SET search_path TO "$user", public;');
    await queryInterface.sequelize.query('SET search_path TO public;');
  }
};
