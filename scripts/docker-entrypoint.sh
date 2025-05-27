#!/bin/sh
set -e

# Función para esperar a que la base de datos esté disponible
wait_for_db() {
  echo "Esperando a que la base de datos esté disponible..."
  
  # Extraer los datos de conexión desde las variables de entorno
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-3306}
  DB_USER=${DB_USER:-fintech_user}
  DB_PASSWORD=${DB_PASSWORD:-your_password}
  DB_NAME=${DB_NAME:-fintech_personal}

  # Esperar a que la base de datos esté disponible
  MAX_RETRIES=30
  RETRY_COUNT=0

  until nc -z $DB_HOST $DB_PORT; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "Error: No se pudo conectar a la base de datos después de $MAX_RETRIES intentos"
      exit 1
    fi
    
    echo "Intentando conectar a la base de datos ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 2
  done

  echo "✅ Base de datos disponible"
}

# Esperar a que la base de datos esté disponible
wait_for_db

# Determinar si es la primera ejecución o una migración es necesaria
echo "Verificando estado de la base de datos..."

# Verificar si las migraciones son necesarias
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Ejecutando migraciones de base de datos..."
  npx sequelize-cli db:migrate

  # Verificar si se deben ejecutar las semillas
  if [ "$RUN_SEEDS" = "true" ]; then
    echo "Ejecutando semillas de base de datos..."
    npx sequelize-cli db:seed:all
  fi
fi

echo "🚀 Iniciando la aplicación Fintech Personal Web App..."
exec node dist/src/index.js
