#!/bin/bash
# Script para inicializar el proyecto completo en entorno de desarrollo local

echo "🚀 Iniciando configuración del proyecto Fintech Personal Web App"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Configurar archivo .env si no existe
if [ ! -f .env ]; then
  echo "⚙️ Creando archivo .env a partir de .env.example..."
  cp .env.example .env
  echo "✅ Archivo .env creado. Por favor, verifica y actualiza las credenciales de la base de datos."
fi

# Compilar TypeScript
echo "🔨 Compilando el proyecto..."
npm run build

# Configurar base de datos (solo en desarrollo local)
if [ "$1" != "--no-db" ]; then
  echo "🗄️ Configurando la base de datos..."
  npm run db:setup
else
  echo "🗄️ Omitiendo configuración de base de datos según parámetro --no-db"
fi

echo "🎉 ¡Configuración completada!"
echo "⚡ Para desarrollo local: npm run dev"
echo "🐳 Para Docker: docker-compose up -d"
echo "🧪 Para pruebas: npm test"
