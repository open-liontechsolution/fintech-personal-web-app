import morgan, { StreamOptions } from 'morgan';
import logger from '../config/logger';

// Stream de salida para Morgan que utiliza nuestro logger Winston
const stream: StreamOptions = {
  // Usar la función write del stream para enviar los logs a Winston
  write: (message) => logger.http(message.trim()),
};

// Determinar el formato de Morgan según el entorno
const getFormat = () => {
  const env = process.env.NODE_ENV || 'development';
  // Formato detallado en desarrollo, formato más conciso en producción
  return env === 'development' 
    ? 'dev'  // Formato colorido para desarrollo
    : 'combined'; // Formato estándar para producción
};

// Crear el middleware Morgan configurado con nuestro stream personalizado
const httpLogger = morgan(getFormat(), { stream });

export default httpLogger;
