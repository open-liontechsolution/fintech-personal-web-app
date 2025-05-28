FROM node:18-alpine AS builder

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Configurar npm para usar el registro público y Verdaccio solo para paquetes privados
RUN echo "registry=https://registry.npmjs.org/" > .npmrc \
    && echo "fintech-personal-common:registry=https://verdaccio.liontechsolution.com/" >> .npmrc \
    && echo "always-auth=false" >> .npmrc

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
# Configurar npm para usar el registro público y Verdaccio solo para paquetes privados
RUN echo "registry=https://registry.npmjs.org/" > .npmrc \
    && echo "fintech-personal-common:registry=https://verdaccio.liontechsolution.com/" >> .npmrc \
    && echo "always-auth=false" >> .npmrc
RUN npm install --omit=dev

# Copiar scripts de inicio
COPY scripts/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3000

# Script de inicio para Docker
ENTRYPOINT ["/app/docker-entrypoint.sh"]
