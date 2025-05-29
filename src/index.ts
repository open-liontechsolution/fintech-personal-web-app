import app from './app';
import sequelize from './config/database';
import logger from './config/logger';

// Set port
const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Sync database models (si no está deshabilitado)
    if (process.env.DISABLE_DB_SYNC !== 'true') {
      // Si FORCE_DB_SYNC es true, forzar la creación de tablas (util para PostgreSQL)
      if (process.env.FORCE_DB_SYNC === 'true') {
        await sequelize.sync({ force: true });
        logger.info('Database forcefully synchronized (tables recreated)');
      } else {
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        logger.info('Database synchronized successfully');
      }
    } else {
      logger.info('Database synchronization skipped (DISABLE_DB_SYNC=true)');
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Iniciando la aplicación Fintech Personal Web App...`);
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🎛️ Dashboard: http://localhost:${PORT}/dashboard`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err}`);
  process.exit(1);
});

// Start the server
startServer();
