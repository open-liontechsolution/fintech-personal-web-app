# Fintech Web App Helm Chart

Este Helm chart permite desplegar la aplicación web de Fintech en un cluster de Kubernetes.

## Estructura del Chart

```
helm/
│├─ Chart.yaml                 # Información básica del chart
│├─ values.yaml                # Valores por defecto para todos los entornos
│├─ environments/              # Valores específicos por entorno
││   └─ dev/                  # Configuración para entorno de desarrollo
││       ├─ values-dev.yaml     # Valores para el entorno dev
││       └─ sealedsecret-dev.yaml # SealedSecret encriptado para dev
│└─ templates/
    ├─ _helpers.tpl           # Plantilla con funciones auxiliares
    ├─ configmap.yaml         # ConfigMap con la configuración de la aplicación
    ├─ deployment.yaml        # Deployment para la aplicación
    ├─ migration-job.yaml     # Jobs para migraciones y semillas de la base de datos
    ├─ postgres-network-policy.yaml # Política de red para acceso a PostgreSQL
    └─ service.yaml           # Servicio para exponer la aplicación
```

## Instalación

### Requisitos Previos

- Kubernetes 1.16+
- Helm 3.1.0+

### Instalación en Entorno Dev

1. Primero aplicar el SealedSecret (solo es necesario hacerlo una vez o cuando cambie):

```bash
kubectl apply -f ./helm/environments/dev/sealedsecret-dev.yaml
```

2. Luego instalar o actualizar el Helm chart:

```bash
helm install fintech-webapp ./helm \
  -f ./helm/environments/dev/values-dev.yaml \
  -n fintech-dev
```

> **IMPORTANTE**: Estamos utilizando **SealedSecrets** para la gestión segura de secretos. Los SealedSecrets son secretos encriptados que pueden almacenarse de forma segura en repositorios de código y solo pueden ser descifrados por el controlador de SealedSecrets dentro del cluster.

## Configuración

### Parámetros Principales

| Parámetro | Descripción | Por defecto |
|-----------|-------------|-------------|
| `replicaCount` | Número de réplicas de la aplicación | `2` |
| `image.repository` | Repositorio de la imagen Docker | `ghcr.io/open-liontechsolution/fintech-personal-web-app` |
| `image.tag` | Tag de la imagen Docker | `latest` |
| `image.pullPolicy` | Política de pull de la imagen | `IfNotPresent` |
| `service.type` | Tipo de servicio de Kubernetes | `ClusterIP` |
| `service.port` | Puerto expuesto por el servicio | `80` |
| `migrations.enabled` | Habilitar Jobs de migraciones | `false` |
| `migrations.runSeeds` | Ejecutar semillas de datos | `false` |

### Configuración de Entorno

Los valores específicos por entorno se encuentran en los archivos dentro del directorio `environments/`:

- `values-dev.yaml`: Valores para el entorno de desarrollo

## Migraciones y Base de Datos

El chart utiliza Jobs de Kubernetes para ejecutar migraciones y semillas de base de datos. Esta es una práctica más segura y profesional que ejecutar migraciones en el contenedor principal de la aplicación.

### Configuración de Migraciones

Los siguientes parámetros permiten configurar los Jobs de migraciones:

```yaml
migrations:
  enabled: true            # Habilitar/deshabilitar migraciones automáticas
  runSeeds: true           # Habilitar/deshabilitar carga de datos semilla
  backoffLimit: 3          # Número máximo de reintentos
  activeDeadlineSeconds: 900  # Tiempo máximo de ejecución en segundos
  ttlSecondsAfterFinished: 3600  # Tiempo antes de eliminar el job completado
```

Los Jobs de migración se ejecutan automáticamente como hooks de pre-install y pre-upgrade, garantizando que la base de datos esté actualizada antes de desplegar la aplicación.

### Parámetros Antiguos (Obsoletos)

Los siguientes parámetros se mantienen por compatibilidad pero ya no se utilizan:

- `config.disableDbSync`: Ahora siempre debe ser `true` para deshabilitar sincronización automática
- `config.runMigrations`: Reemplazado por `migrations.enabled`
- `config.runSeeds`: Reemplazado por `migrations.runSeeds`

## ArgoCD

Para usar este chart con ArgoCD, cree una aplicación con la siguiente configuración:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: fintech-webapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: [URL_DEL_REPOSITORIO]
    targetRevision: HEAD
    path: helm
    helm:
      valueFiles:
        - environments/values-dev.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: fintech-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Health Check

Esta aplicación incluye un endpoint de health check en `/api/health` que es utilizado por los liveness y readiness probes configurados en el deployment.
