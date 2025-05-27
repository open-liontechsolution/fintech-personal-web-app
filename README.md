# Fintech Personal - Web App

Aplicación web para la gestión de finanzas personales que permite a los usuarios importar, visualizar y analizar sus datos financieros.

## Características

- Interfaz de usuario para subir archivos CSV/Excel de transacciones bancarias
- Sistema de autenticación de usuarios con JWT
- Registro por invitación cerrada (solo se puede registrar con un código válido)
- Almacenamiento de datos en MySQL/MariaDB
- Comunicación con otros microservicios a través de RabbitMQ
- Visualización de transacciones y reportes financieros
- Dashboard con resumen de transacciones y gráficos

## Arquitectura

Este servicio es parte de una arquitectura de microservicios:

- **web-app**: Interfaz de usuario y API REST (este repositorio)
- **data-import**: Procesamiento de archivos CSV/Excel
- **data-transf**: Transformación de datos para análisis

### Estructura del Proyecto

```
fintech-personal-web-app/
├── src/
│   ├── config/            # Configuración de la aplicación
│   ├── controllers/       # Controladores de la API
│   ├── middleware/        # Middleware (autenticación, errores)
│   ├── migrations/        # Migraciones de base de datos
│   ├── models/            # Modelos de datos (Sequelize)
│   ├── public/            # Archivos estáticos (CSS, JS)
│   ├── routes/            # Rutas de la API
│   ├── seeders/           # Semillas para datos iniciales
│   ├── services/          # Lógica de negocio
│   ├── utils/             # Utilidades
│   ├── validators/        # Validadores de datos
│   ├── views/             # Plantillas EJS para la interfaz web
│   ├── app.ts             # Configuración de Express
│   └── index.ts           # Punto de entrada de la aplicación
├── scripts/               # Scripts de utilidad
├── .env.example           # Plantilla para variables de entorno
├── .sequelizerc           # Configuración de Sequelize CLI
├── package.json           # Dependencias del proyecto
└── tsconfig.json          # Configuración de TypeScript
```

## Prerrequisitos

- Node.js >= 14.0.0
- MySQL/MariaDB
- RabbitMQ
- Registro NPM privado (para dependencias internas)

## Instalación y Ejecución

### Desarrollo Local

Para una instalación rápida del proyecto en desarrollo local, puedes utilizar el script de inicialización:

```bash
./scripts/init-project.sh
```

Este script realizará los siguientes pasos:
1. Instalar dependencias
2. Crear el archivo .env a partir de .env.example
3. Compilar el proyecto TypeScript
4. Configurar la base de datos y ejecutar migraciones

Después de la instalación, puedes iniciar el servidor con `npm run dev`.

### Usando Docker

Para ejecutar la aplicación con Docker y servicios asociados (MySQL, RabbitMQ) en entorno de desarrollo local:

```bash
# Construir y arrancar los servicios en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f webapp

# Detener los servicios
docker-compose down
```

La aplicación estará disponible en http://localhost:3000.

### Construcción de Imagen Docker

Para construir manualmente la imagen Docker (aunque normalmente esto lo hace el pipeline de CI/CD):

```bash
# Construir la imagen
docker build -t ghcr.io/your-username/fintech-personal-web-app:latest .

# Ejecutar localmente
docker run -p 3000:3000 ghcr.io/your-username/fintech-personal-web-app:latest
```

## Instalación Manual

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

4. Configurar la base de datos
```bash
npm run db:setup
```

5. Iniciar el servidor en modo desarrollo
```bash
npm run dev
```

## Comandos Disponibles

### Comandos npm

- `npm run dev`: Inicia el servidor en modo desarrollo con recarga automática
- `npm run build`: Compila el proyecto TypeScript
- `npm run start`: Inicia el servidor en modo producción
- `npm run db:setup`: Configura la base de datos, ejecuta migraciones y semillas
- `npm run db:migrate`: Ejecuta solo las migraciones de base de datos
- `npm run db:seed`: Ejecuta solo las semillas de base de datos
- `npm run lint`: Ejecuta el linter para verificar el código
- `npm run test`: Ejecuta los tests

### Comandos Docker

- `docker-compose up -d`: Inicia todos los servicios en segundo plano
- `docker-compose up --build -d`: Reconstruye e inicia los servicios
- `docker-compose down`: Detiene todos los servicios
- `docker-compose logs -f webapp`: Muestra los logs de la aplicación
- `docker-compose exec webapp sh`: Abre un shell en el contenedor de la aplicación

### Comandos Kubernetes y ArgoCD

- `kubectl get pods -n fintech`: Ver los pods de la aplicación
- `kubectl logs -f deployment/webapp -n fintech`: Ver logs de la aplicación
- `kubectl port-forward svc/webapp 3000:3000 -n fintech`: Acceder localmente a la aplicación
- `argocd app sync webapp`: Sincronizar manualmente la aplicación en ArgoCD

## Dependencias

Este servicio utiliza el paquete `fintech-personal-common` que proporciona:
- DTOs y esquemas compartidos
- Utilidades de validación
- Cliente RabbitMQ
- Manejo de errores estandarizado

## Despliegue en Kubernetes con ArgoCD

La aplicación está configurada para un modelo de despliegue GitOps utilizando ArgoCD en un cluster de Kubernetes.

### Flujo de CI/CD

1. **Integración Continua**:
   - Cuando se hace push a las ramas `main` o `develop`, o se crea un tag con formato `v*`, se inicia el workflow de GitHub Actions
   - Se ejecutan pruebas de validación y tests unitarios
   - Se construye la imagen Docker y se publica en GitHub Container Registry (GHCR)

2. **Despliegue Continuo**:
   - Si el push es a `main` o es un tag de versión, se actualiza automáticamente la referencia de la imagen en el repositorio de configuración de Kubernetes
   - ArgoCD detecta el cambio y actualiza la aplicación en el cluster correspondiente

### Requisitos para el Despliegue

1. Configurar los siguientes secretos en GitHub:
   - `K8S_REPO_TOKEN`: Token con permisos para actualizar el repositorio de configuración de Kubernetes

2. El repositorio `fintech-personal-k8s` debe existir y contener la configuración de Kubernetes para la aplicación.

### Integración con la Infraestructura Existente

La aplicación se integra con la infraestructura existente mediante:

1. **ArgoCD**: Monitorea el repositorio de configuración y sincroniza los cambios con el cluster
2. **GitHub Container Registry**: Almacena las imágenes de contenedor
3. **Kubernetes**: Gestiona los contenedores en el cluster
4. **FRP (Fast Reverse Proxy)**: Proporciona acceso externo al cluster

## Sistema de Registro por Invitación

El registro de nuevos usuarios está restringido mediante códigos de invitación. Características principales:

- Solo se puede registrar con un código de invitación válido
- Los códigos de invitación pueden tener fecha de expiración
- Un código de invitación solo puede ser utilizado una vez
- Los administradores pueden generar nuevos códigos de invitación

Los códigos iniciales se crean automáticamente durante la configuración de la base de datos.

## Dashboard de Transacciones

El dashboard muestra un resumen de las transacciones del usuario y proporciona las siguientes características:

- Resumen de ingresos, gastos y balance
- Filtrado por períodos (día, semana, mes, año)
- Listado de transacciones recientes
- Visualización de gráficos para análisis financiero

## Documentación API

La documentación completa de la API REST está disponible en:
- `/api-docs` (una vez que el servidor esté en ejecución)

### Principales Endpoints API

#### Autenticación
- `POST /api/auth/register` - Registro de nuevo usuario (requiere código de invitación)
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener información del usuario actual
- `POST /api/auth/invitation-code` - Generar nuevo código de invitación (requiere autenticación)

#### Transacciones
- `GET /api/transactions` - Listar transacciones del usuario
- `GET /api/transactions/:id` - Obtener detalles de una transacción
- `POST /api/transactions` - Crear nueva transacción
- `PUT /api/transactions/:id` - Actualizar transacción existente
- `DELETE /api/transactions/:id` - Eliminar transacción
- `GET /api/transactions/summary` - Obtener resumen de transacciones

## Licencia

AGPL-3.0
