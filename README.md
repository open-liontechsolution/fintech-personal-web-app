# Fintech Personal - Web App

Aplicación web para la gestión de finanzas personales que permite a los usuarios importar, visualizar y analizar sus datos financieros.

## Características

- Interfaz de usuario para subir archivos CSV/Excel de transacciones bancarias
- Sistema de autenticación de usuarios con JWT
- Almacenamiento de archivos utilizando MongoDB GridFS
- Comunicación con otros microservicios a través de RabbitMQ
- Visualización de transacciones y reportes financieros

## Arquitectura

Este servicio es parte de una arquitectura de microservicios:

- **web-app**: Interfaz de usuario y API REST (este repositorio)
- **data-import**: Procesamiento de archivos CSV/Excel
- **data-transf**: Transformación de datos para análisis

## Prerrequisitos

- Node.js >= 14.0.0
- MongoDB
- RabbitMQ
- Registro NPM privado (para dependencias internas)

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/yourusername/fintech-personal-web-app.git
cd fintech-personal-web-app
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar el archivo .env con la configuración correcta
```

4. Iniciar el servidor en modo desarrollo
```bash
npm run dev
```

## Dependencias

Este servicio utiliza el paquete `fintech-personal-common` que proporciona:
- DTOs y esquemas compartidos
- Utilidades de validación
- Cliente RabbitMQ
- Manejo de errores estandarizado

## Endpoints API

La documentación completa de la API REST está disponible en:
- `/api-docs` (una vez que el servidor esté en ejecución)

## Licencia

AGPL-3.0
