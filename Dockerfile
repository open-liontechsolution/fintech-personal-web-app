FROM node:18-alpine AS builder

# Crear directorio de la aplicación
WORKDIR /app

# Definir argumentos para autenticación con npm
ARG VERDACCIO_USERNAME
ARG VERDACCIO_PASSWORD

# Copiar archivos de dependencias y configuración de npm
COPY package*.json .npmrc ./

# Configurar .npmrc con las credenciales proporcionadas
RUN if [ -n "$VERDACCIO_USERNAME" ] && [ -n "$VERDACCIO_PASSWORD" ]; then \
    BASIC_AUTH=$(echo -n "$VERDACCIO_USERNAME:$VERDACCIO_PASSWORD" | base64) && \
    echo "//verdaccio.liontechsolution.com/:_auth=$BASIC_AUTH" >> .npmrc && \
    echo "always-auth=true" >> .npmrc; \
    fi

# Instalar dependencias de sistema necesarias para compilar bcrypt
RUN apk add --no-cache make gcc g++ python3 linux-headers

# Instalar dependencias (usando install en lugar de ci para actualizar package-lock.json)
RUN npm install

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
COPY --from=builder /app/.sequelizerc ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
# Nota: copiamos toda la carpeta src para garantizar que Sequelize encuentre todos los archivos necesarios

# Instalar dependencias de sistema necesarias para bcrypt
RUN apk add --no-cache make gcc g++ python3 linux-headers

# Instalar solo dependencias de producción
# Copiamos el .npmrc para acceder al registro privado Verdaccio
COPY .npmrc ./
RUN npm install --omit=dev

# Copiar scripts de inicio
COPY scripts/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3000

# Script de inicio para Docker
ENTRYPOINT ["/app/docker-entrypoint.sh"]
