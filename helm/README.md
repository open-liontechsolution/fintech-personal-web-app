# Fintech Web App Helm Chart

Este Helm chart permite desplegar la aplicación web de Fintech en un cluster de Kubernetes.

## Estructura del Chart

```
helm/
├── Chart.yaml                 # Información básica del chart
├── values.yaml                # Valores por defecto para todos los entornos
├── environments/
│   └── values-dev.yaml        # Valores específicos para el entorno dev
└── templates/
    ├── _helpers.tpl           # Plantilla con funciones auxiliares
    ├── configmap.yaml         # ConfigMap con la configuración de la aplicación
    ├── deployment.yaml        # Deployment para la aplicación
    ├── postgres-network-policy.yaml # Política de red para acceso a PostgreSQL
    ├── secrets.yaml           # Secretos para la aplicación
    └── service.yaml           # Servicio para exponer la aplicación
```

## Instalación

### Requisitos Previos

- Kubernetes 1.16+
- Helm 3.1.0+

### Instalación en Entorno Dev

```bash
helm install fintech-webapp ./helm -f ./helm/environments/values-dev.yaml -n fintech-dev
```

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

### Configuración de Entorno

Los valores específicos por entorno se encuentran en los archivos dentro del directorio `environments/`:

- `values-dev.yaml`: Valores para el entorno de desarrollo

## Migraciones y Sincronización de Base de Datos

El chart incluye parámetros para controlar migraciones y sincronización de base de datos:

- `config.disableDbSync`: Deshabilitar sincronización automática de la base de datos
- `config.runMigrations`: Ejecutar migraciones al iniciar la aplicación
- `config.runSeeds`: Ejecutar semillas de datos al iniciar la aplicación

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
