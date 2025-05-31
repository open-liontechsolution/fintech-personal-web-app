# Configuración de Base de Datos

Este directorio contiene la configuración de la conexión a la base de datos PostgreSQL utilizada por la aplicación.

## Archivos de Configuración

- `sequelize.js`: Configuración principal para Sequelize ORM, usada tanto por la aplicación como por las migraciones.

## Variables de Entorno

Las siguientes variables de entorno son utilizadas para configurar la conexión:

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| DB_HOST | Host de la base de datos | `localhost` (dev/test), `postgresql-primary...` (prod) |
| DB_PORT | Puerto de la base de datos | `5432` |
| DB_NAME | Nombre de la base de datos | `fintech_personal` |
| DB_USER | Usuario de la base de datos | `fintech_user` |
| DB_PASSWORD | Contraseña | `fintech_password` (solo en dev) |
| DB_SCHEMA | Esquema de PostgreSQL | `fintech` |
| DB_SSL | Habilitar SSL para la conexión | No definido (false) |
| DB_SSL_VERIFY | Verificar certificado SSL | No definido (true) |

## Configuración para Kubernetes

En entornos de Kubernetes, las variables de entorno son proporcionadas por el ConfigMap y los Secrets. Es importante asegurarse de que:

1. La variable `DB_HOST` apunte al servicio correcto de PostgreSQL
2. No exista una variable `DATABASE_URL` que pueda sobrescribir la configuración individual

## Migraciones

Las migraciones utilizan esta misma configuración, definida en el archivo `.sequelizerc` en la raíz del proyecto.

## Solución de Problemas

Si hay problemas de conexión:

1. Verificar que las variables de entorno estén correctamente configuradas
2. Comprobar que los servicios de base de datos estén disponibles
3. Verificar la red entre los servicios (NetworkPolicy en Kubernetes)
4. Revisar los logs de la aplicación con `LOG_LEVEL=debug`
