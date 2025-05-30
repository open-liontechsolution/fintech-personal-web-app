#!/bin/sh
set -e

# Función para esperar a que la base de datos esté disponible
wait_for_db() {
  echo "Esperando a que la base de datos esté disponible..."
  
  # Extraer los datos de conexión desde las variables de entorno
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}
  DB_USER=${DB_USER:-fintech_user}
  DB_PASSWORD=${DB_PASSWORD:-fintech_password}
  DB_NAME=${DB_NAME:-fintech_personal}

  # Esperar hasta que la base de datos esté disponible
  i=1
  while ! nc -z $DB_HOST $DB_PORT; do
    if [ "$i" -ge 30 ]; then
      echo "Error: Base de datos no disponible después de 30 intentos."
      exit 1
    fi
    echo "Intentando conectar a la base de datos ($i/30)..."
    sleep 2
    i=$((i+1))
  done
  echo "\u2705 Base de datos disponible"

  # Esperar un poco más para asegurarse de que la base de datos esté lista para consultas
  sleep 3
}

# Esperar a que la base de datos esté disponible
wait_for_db

# Determinar si es la primera ejecución o una migración es necesaria
echo "Verificando estado de la base de datos..."

# Crear la base de datos si no existe (PostgreSQL)
createdb_if_not_exists() {
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -c "CREATE DATABASE $DB_NAME"
  echo "Base de datos verificada o creada"
}

# Verificar si las migraciones son necesarias
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Preparando base de datos PostgreSQL..."
  # Instalar cliente PostgreSQL
  apk --no-cache add postgresql-client
  
  # Crear la base de datos si no existe
  createdb_if_not_exists
  
  # Crear extensiones necesarias para PostgreSQL
  echo "Configurando extensiones de PostgreSQL..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  # Nota: PostGIS no se instala ya que requiere paquetes adicionales en el servidor
  
  # En lugar de intentar sincronizar con JS, vamos a crear primero la estructura básica con SQL
  if [ "$FORCE_DB_SYNC" = "true" ]; then
    echo "Asegurando que el esquema fintech exista..."
    # Crear el esquema fintech si no existe
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE SCHEMA IF NOT EXISTS fintech;"
    
    echo "Asegurando que las tablas principales existan en el esquema fintech..."
    # Crear las tablas principales en el esquema fintech si no existen
    # Primero crear la tabla de cuentas
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS fintech.accounts (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) DEFAULT 'checking',
      institution VARCHAR(100),
      account_number VARCHAR(50),
      balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      is_active BOOLEAN DEFAULT true,
      color VARCHAR(7),
      icon VARCHAR(50),
      last_sync TIMESTAMP,
      notes TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );"
    
    # Crear la tabla de categorías
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS fintech.categories (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      color VARCHAR(7),
      icon VARCHAR(50),
      parent_id UUID,
      is_system BOOLEAN DEFAULT false,
      user_id UUID,
      type VARCHAR(20) DEFAULT 'expense',
      metadata JSONB,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );"
    
    # Crear la tabla transactions con todas las columnas necesarias
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS fintech.transactions (
      id UUID PRIMARY KEY, 
      user_id UUID NOT NULL, 
      account_id UUID,
      category_id UUID,
      subcategory_id UUID,
      amount DECIMAL(15,2) NOT NULL, 
      currency CHAR(3) NOT NULL DEFAULT 'EUR',
      date TIMESTAMP NOT NULL, 
      description TEXT,
      notes TEXT,
      is_recurring BOOLEAN DEFAULT false,
      tags TEXT[],
      location JSONB,
      status VARCHAR(20) DEFAULT 'completed',
      metadata JSONB,
      import_id UUID,
      created_at TIMESTAMP NOT NULL, 
      updated_at TIMESTAMP NOT NULL
    );"
    
    # Crear la tabla de tasas de cambio
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS fintech.exchange_rates (
      id UUID PRIMARY KEY,
      source_currency CHAR(3) NOT NULL,
      target_currency CHAR(3) NOT NULL,
      rate DECIMAL(20,10) NOT NULL,
      date DATE NOT NULL,
      source VARCHAR(50) DEFAULT 'manual',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );"
    echo "Estructura básica de tablas creada."
  fi
  
  # Ejecutar migraciones para asegurar estructura de datos consistente
  echo "Ejecutando migraciones de base de datos..."
  cd /app && NODE_ENV=$NODE_ENV DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_NAME=$DB_NAME DB_SCHEMA=fintech npx sequelize-cli db:migrate

  # Verificar si se deben ejecutar las semillas
  if [ "$RUN_SEEDS" = "true" ]; then
    echo "Ejecutando semillas de base de datos..."
    cd /app && NODE_ENV=$NODE_ENV DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_NAME=$DB_NAME npx sequelize-cli db:seed:all
    
    # Verificar si se deben cargar datos de prueba solo en entorno local sin persistencia
    if [ "$SEED_TEST_DATA" = "true" ] && [ "$DISABLE_DB_SYNC" = "true" ] && [ "$IS_CLUSTER" != "true" ]; then
      echo "Cargando datos de prueba para desarrollo local sin persistencia..."
      cd /app && NODE_ENV=$NODE_ENV DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_NAME=$DB_NAME IS_CLUSTER=$IS_CLUSTER DISABLE_DB_SYNC=$DISABLE_DB_SYNC SEED_TEST_DATA=$SEED_TEST_DATA npx sequelize-cli db:seed --seed 20230527-dev-test-data.js
    else
      echo "Omitiendo la carga de datos de prueba - Este entorno tiene persistencia o es un cluster"
    fi
  fi
fi

echo "🚀 Iniciando la aplicación Fintech Personal Web App..."
exec node dist/src/index.js
