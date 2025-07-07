#!/bin/bash
set -e

echo "🚀 Iniciando entorno de desarrollo local con datos de prueba"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instálalo antes de continuar."
    exit 1
fi

# Verificar si Docker Compose está disponible
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose no está disponible. Por favor, instálalo antes de continuar."
    exit 1
fi

echo "🧹 Limpiando entorno anterior (si existe)"
docker compose down -v

echo "🧹 Eliminando restos de contenedores para desocupar espacio de almacenamiento"
docker system prune -a --volumes

echo "🏗️ Construyendo y levantando servicios"
docker compose up -d --build

echo "⏳ Esperando a que los servicios estén listos..."
sleep 5

echo "📋 Estado de los contenedores:"
docker compose ps

echo "📝 Usuarios de prueba disponibles:"
echo "  - Email: test@example.com / Password: Password123!"
echo "  - Email: admin@example.com / Password: Admin123!"

echo "🌐 Aplicación disponible en: http://localhost:3000"
echo "📊 Para ver los logs: docker compose logs -f webapp"
echo "❓ Para detener la aplicación: docker compose down"
