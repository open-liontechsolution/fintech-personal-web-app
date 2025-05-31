require('dotenv').config();

// Validación de variables de entorno críticas para el entorno de producción
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`ADVERTENCIA: Variables de entorno requeridas no definidas: ${missing.join(', ')}`);
    console.error('La aplicación podría no funcionar correctamente.');
  }
}

// Log de configuración para facilitar la depuración
if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
  console.log('Configuración de base de datos:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_SCHEMA: ${process.env.DB_SCHEMA}`);
}

module.exports = {
  development: {
    username: process.env.DB_USER || 'fintech_user',
    password: process.env.DB_PASSWORD || 'fintech_password',
    database: process.env.DB_NAME || 'fintech_personal',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: console.log,
    schema: process.env.DB_SCHEMA || 'fintech',
    // Crear el esquema automáticamente si no existe
    dialectOptions: {
      useUTC: false,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  test: {
    username: process.env.TEST_DB_USER || 'fintech_user',
    password: process.env.TEST_DB_PASSWORD || 'your_password',
    database: process.env.TEST_DB_NAME || 'fintech_personal_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    schema: process.env.DB_SCHEMA || 'fintech',
    // Crear el esquema automáticamente si no existe
    dialectOptions: {
      useUTC: false,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'postgresql-primary.generic.svc.cluster.local',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    // Habilitar logging condicional para depuración
    logging: process.env.LOG_LEVEL === 'debug' ? console.log : false,
    schema: process.env.DB_SCHEMA || 'fintech',
    // Crear el esquema automáticamente si no existe
    dialectOptions: {
      useUTC: false,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    // Configuración SSL condicional
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_VERIFY !== 'false'
      }
    } : {},
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
  }
};
