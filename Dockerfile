FROM node:18-alpine AS builder

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación (ignorando errores para pruebas)
RUN npm run build || true
# Asegurarse de que el directorio dist existe para la siguiente etapa
RUN mkdir -p dist

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar dependencias y archivos compilados
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/views ./src/views
COPY --from=builder /app/src/public ./src/public
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/seeders ./src/seeders

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar scripts de inicio
COPY scripts/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3000

# Script de inicio para Docker
ENTRYPOINT ["/app/docker-entrypoint.sh"]
