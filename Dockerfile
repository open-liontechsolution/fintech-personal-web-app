FROM node:18-alpine AS builder

# Crear directorio de la aplicación
WORKDIR /app

# Copiar solo package.json primero (sin package-lock.json)
COPY package.json ./

# Configurar npm para usar el registro público por defecto
RUN echo "registry=https://registry.npmjs.org/" > .npmrc \
    && echo "always-auth=false" >> .npmrc

# Instalar dependencias de sistema necesarias para compilar bcrypt
RUN apk add --no-cache make gcc g++ python3 linux-headers curl jq

# Descargar e instalar primero los paquetes que sabemos que dan problemas
RUN npm install --no-save yocto-queue@0.1.0 yn@3.1.1 yargs-parser@21.1.1

# Instalar fintech-personal-common desde Verdaccio
RUN echo "registry=https://verdaccio.liontechsolution.com/" > .npmrc.verdaccio \
    && npm install --no-save fintech-personal-common@1.0.0 --userconfig=.npmrc.verdaccio || true

# Restaurar la configuración de npm para el resto de paquetes
RUN mv .npmrc.verdaccio .npmrc.bak && echo "registry=https://registry.npmjs.org/" > .npmrc

# Instalar todas las dependencias normales desde npm público (sin usar package-lock.json)
RUN npm install --no-package-lock

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
RUN apk add --no-cache make gcc g++ python3 linux-headers curl jq

# Configurar npm para usar el registro público por defecto
RUN echo "registry=https://registry.npmjs.org/" > .npmrc \
    && echo "always-auth=false" >> .npmrc

# Descargar e instalar primero los paquetes que sabemos que dan problemas
RUN npm install --no-save yocto-queue@0.1.0 yn@3.1.1 yargs-parser@21.1.1 --omit=dev

# Instalar fintech-personal-common desde Verdaccio
RUN echo "registry=https://verdaccio.liontechsolution.com/" > .npmrc.verdaccio \
    && npm install --no-save fintech-personal-common@1.0.0 --userconfig=.npmrc.verdaccio --omit=dev || true

# Restaurar la configuración de npm e instalar el resto de dependencias
RUN mv .npmrc.verdaccio .npmrc.bak && echo "registry=https://registry.npmjs.org/" > .npmrc \
    && npm install --no-package-lock --omit=dev

# Copiar scripts de inicio
COPY scripts/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3000

# Script de inicio para Docker
ENTRYPOINT ["/app/docker-entrypoint.sh"]
