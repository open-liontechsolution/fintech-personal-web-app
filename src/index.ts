import app from './app';
import sequelize from './config/database';

// Set port
const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Sync database models (si no está deshabilitado)
    if (process.env.DISABLE_DB_SYNC !== 'true') {
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('Database synchronized successfully');
    } else {
      console.log('Database synchronization skipped (DISABLE_DB_SYNC=true)');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
