# Flujo de Trabajo GitOps para Fintech Personal

Este documento describe el flujo de trabajo GitOps implementado para el proyecto Fintech Personal, detallando cómo gestionar diferentes tipos de releases (minor y major) a través de los distintos entornos (desarrollo, QA y producción).

## Estructura de Entornos

El proyecto utiliza tres entornos separados, cada uno con su propio namespace en el cluster Kubernetes:

| Entorno     | Namespace     | Propósito                                    | Configuración                      |
|-------------|---------------|----------------------------------------------|-----------------------------------|
| Desarrollo  | `fintech-dev` | Integración continua, pruebas rápidas        | `kubernetes/overlays/dev`         |
| QA          | `fintech-qa`  | Validación de releases, pruebas completas    | `kubernetes/overlays/qa`          |
| Producción  | `fintech-prod`| Entorno estable para usuarios finales        | `kubernetes/overlays/prod`        |

## Modelo de Ramas

La estrategia de ramas está diseñada para facilitar un flujo de trabajo ordenado:

- **`main`**: Código estable listo para producción
- **`develop`**: Rama de integración continua
- **`feature/*`**: Desarrollo de nuevas características
- **`release/v*`**: Preparación de releases para QA
- **`hotfix/*`**: Correcciones urgentes para producción
- **`env/qa`**: Refleja el estado actual en QA
- **`env/prod`**: Refleja el estado actual en producción

## Tipos de Releases

El proyecto diferencia entre dos tipos principales de releases:

### Minor Releases (v1.2.0, v1.3.0, etc.)

- **Características**:
  - Nuevas funcionalidades con compatibilidad hacia atrás
  - Mejoras incrementales
  - No rompen interfaces existentes

- **Proceso**:
  - Pruebas estándar
  - Revisión por el equipo de QA
  - Aprobación del líder técnico
  - Despliegue directo

- **Tiempo en QA**: 1-2 días

### Major Releases (v2.0.0, v3.0.0, etc.)

- **Características**:
  - Cambios incompatibles con versiones anteriores
  - Transformaciones arquitectónicas significativas
  - Actualizaciones importantes en la interfaz de usuario

- **Proceso**:
  - Pruebas exhaustivas (incluyendo e2e)
  - Revisión por equipo de QA, líderes técnicos y stakeholders
  - Documentación completa de cambios y migraciones
  - Plan de rollback detallado
  - Estrategia de despliegue blue/green

- **Tiempo en QA**: 3-7 días

## Flujo de Trabajo Detallado

### 1. Desarrollo de Nuevas Características

```bash
# Crear rama para nueva característica
git checkout develop
git pull
git checkout -b feature/nueva-funcionalidad

# Desarrollo normal con commits frecuentes
git add .
git commit -m "feat: implementar nueva funcionalidad"
git push -u origin feature/nueva-funcionalidad

# Al finalizar, crear Pull Request hacia develop
# El equipo revisa el código y aprueba los cambios
# La integración activa automáticamente el despliegue en dev
```

### 2. Preparación de un Minor Release

```bash
# Crear rama de release desde develop
git checkout develop
git pull
git checkout -b release/v1.2.0
git push -u origin release/v1.2.0

# La creación de esta rama activa el workflow de QA
# El sistema determina automáticamente que es un minor release

# Si se requieren ajustes:
git commit -m "fix: ajuste para release v1.2.0"
git push

# Una vez aprobado en QA, se crea el tag final
git tag v1.2.0
git push origin v1.2.0

# El tag activa el workflow de producción
```

### 3. Preparación de un Major Release

```bash
# Crear rama de release para major version
git checkout develop
git pull
git checkout -b release/v2.0.0
git push -u origin release/v2.0.0

# La creación de esta rama activa el workflow de QA
# El sistema detecta que es un major release y ejecuta pruebas más extensas

# Documentar cambios incompatibles y guías de migración
git add MIGRATION_GUIDE.md
git commit -m "docs: agregar guía de migración para v2.0.0"
git push

# Una vez completadas todas las revisiones y aprobaciones:
git tag v2.0.0
git push origin v2.0.0

# El tag activa el workflow de producción con estrategia blue/green
```

### 4. Corrección Urgente en Producción

```bash
# Crear hotfix desde main
git checkout main
git pull
git checkout -b hotfix/v1.2.1

# Implementar y probar la corrección
git commit -m "fix: corregir problema crítico"

# Crear PR hacia main
# Después de aprobación:
git tag v1.2.1
git push origin v1.2.1

# Luego fusionar también en develop
git checkout develop
git pull
git merge hotfix/v1.2.1
git push
```

## Comandos Comunes del Flujo de Trabajo

### Ciclo de Desarrollo Normal

```bash
# 1. Actualizar develop
git checkout develop
git pull

# 2. Crear rama feature
git checkout -b feature/nombre-funcionalidad

# 3. Desarrollo con commits convencionales
git commit -m "feat: añadir nueva funcionalidad"
git commit -m "fix: corregir problema en componente X"
git commit -m "refactor: mejorar estructura de datos"

# 4. Publicar rama y crear PR
git push -u origin feature/nombre-funcionalidad
# Crear PR desde GitHub UI
```

### Preparación de Release

```bash
# Crear release minor
git checkout develop
git pull
git checkout -b release/v1.2.0
git push -u origin release/v1.2.0

# O release major
git checkout develop
git pull
git checkout -b release/v2.0.0
git push -u origin release/v2.0.0
```

### Despliegue a Producción

```bash
# Tras aprobar en QA, crear tag
git checkout release/v1.2.0
git pull
git tag v1.2.0
git push origin v1.2.0
```

## Infraestructura GitOps con ArgoCD

Este proyecto sigue un enfoque GitOps puro usando ArgoCD para gestionar los despliegues en Kubernetes.

### Arquitectura de Repositorios

El sistema utiliza una arquitectura de dos repositorios:

1. **Repositorio de Aplicación** (este repo): Contiene el código fuente y los workflows de CI/CD
2. **Repositorio de Infraestructura** (`fintech-personal-k8s`): Contiene los manifiestos de Kubernetes que ArgoCD observa

### Workflow de GitHub Actions

El repositorio incluye tres workflows principales:

1. **dev-deploy.yml**: Activado por cambios en `develop`
   - Construye y publica la imagen Docker con tag `sha-XXXXXXX`
   - Actualiza el manifiesto en `fintech-personal-k8s/apps/webapp/overlays/dev`

2. **qa-deploy.yml**: Activado por cambios en ramas `release/*`
   - Construye y publica la imagen Docker con tag `rc-vX.Y.Z`
   - Actualiza el manifiesto en `fintech-personal-k8s/apps/webapp/overlays/qa`

3. **prod-deploy.yml**: Activado por tags `v*`
   - Construye y publica la imagen Docker con el tag específico `vX.Y.Z` 
   - Actualiza el manifiesto en `fintech-personal-k8s/apps/webapp/overlays/prod`

Cada workflow está adaptado a las necesidades específicas de su entorno y determina automáticamente si se trata de un minor o major release basado en el patrón de versión.

### Flujo de despliegue con ArgoCD

1. **Cambios en el código fuente** → Activación de workflow de GitHub Actions
2. **GitHub Actions** → Construye imagen, la publica y actualiza manifiestos en el repo de infraestructura
3. **ArgoCD** → Detecta cambios en el repo de infraestructura y despliega automáticamente
4. **Kubernetes** → Aplica los cambios en el clúster

ArgoCD está configurado con tres aplicaciones diferentes, una para cada entorno:

| Aplicación ArgoCD | Origen | Destino |
|-------------------|--------|----------|
| fintech-webapp-dev | fintech-personal-k8s/apps/webapp/overlays/dev | namespace: fintech-dev |
| fintech-webapp-qa | fintech-personal-k8s/apps/webapp/overlays/qa | namespace: fintech-qa |
| fintech-webapp-prod | fintech-personal-k8s/apps/webapp/overlays/prod | namespace: fintech-prod |

## Convenciones de Commits

Para facilitar la generación automática de changelogs y la determinación del tipo de release, se recomienda seguir [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva característica (minor)
- `feat!:` - Nueva característica con cambios incompatibles (major)
- `fix:` - Corrección de errores (patch)
- `docs:` - Cambios en documentación
- `refactor:` - Refactorización de código
- `test:` - Adición o corrección de pruebas
- `chore:` - Tareas rutinarias, actualizaciones de dependencias, etc.

## Consideraciones para fintech-personal-common

La dependencia `fintech-personal-common` requiere un tratamiento especial:

1. **Acceso al registro privado**: Asegúrate de que el archivo `.npmrc` esté configurado correctamente para acceder a `verdaccio.liontechsolution.com`.

2. **Manejo robusto de tipos**: El código incluye manejo robusto de tipos y clases de error del paquete `fintech-personal-common` para funcionar incluso cuando hay problemas de acceso:
   - Se importan de forma condicional
   - Se proporcionan implementaciones de respaldo
   - Se verifican antes de usar operadores `instanceof`

3. **Versiones en releases**: Para major releases, es importante verificar la compatibilidad con `fintech-personal-common` y posiblemente actualizar también esta dependencia.

## Resolución de Problemas Comunes

### Errores de TypeScript con fintech-personal-common

Si encuentras errores relacionados con tipos o clases de `fintech-personal-common`:

1. Verifica la configuración de `.npmrc`
2. Comprueba la conectividad con el registro Verdaccio
3. Revisa si se han añadido o cambiado tipos/clases en el paquete

### Problemas con la sincronización de base de datos

Para entornos de desarrollo/prueba:
```bash
# Configurar variables de entorno para deshabilitar sincronización
export DISABLE_DB_SYNC=true
export RUN_MIGRATIONS=false
export RUN_SEEDS=false
```

Para diagnóstico, puedes ejecutar:
```bash
# Ver las tablas actuales
docker-compose exec db mysql -u fintech_user -pfintech_password -e "SHOW TABLES FROM fintech_personal"

# Reiniciar sin persistencia
docker-compose down
docker-compose up -d
```
