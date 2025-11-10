# Despliegue en Kubernetes

Este directorio contiene todos los manifiestos necesarios para desplegar la aplicación Biblioteca Xonler en Kubernetes.

## Requisitos Previos

1. Cluster de Kubernetes funcionando
2. `kubectl` instalado y configurado
3. Imagen Docker de la aplicación construida y disponible
   - Opción A: Imagen local (usar `imagePullPolicy: Never`)
   - Opción B: Imagen en registry (Docker Hub, GitHub Container Registry, etc.)

## Estructura de Archivos

```
k8s/
├── namespace.yaml                    # Namespace de la aplicación
├── configmap.yaml                   # Configuración no sensible
├── secrets.yaml                     # Datos sensibles (contraseñas, secrets)
├── persistent-volumes.yaml          # Volúmenes persistentes
├── postgresql-deployment.yaml       # Deployment y Service de PostgreSQL
├── postgresql-service.yaml          # (incluido en deployment)
├── postgresql-init-script-configmap.yaml # ConfigMap con script SQL de inicialización
├── postgresql-init-job.yaml         # Job para ejecutar script SQL después de que PostgreSQL esté listo
├── postgres-exporter-deployment.yaml # PostgreSQL Exporter para métricas
├── app-deployment.yaml              # Deployment y Service de la app Node.js
├── app-service.yaml                 # (incluido en deployment)
├── prometheus-configmap.yaml        # Configuración de Prometheus
├── prometheus-deployment.yaml       # Deployment y Service de Prometheus
├── grafana-configmap.yaml          # Configuración de Grafana
├── grafana-deployment.yaml          # Deployment y Service de Grafana
├── cadvisor-daemonset.yaml          # DaemonSet de cAdvisor
├── dbeaver-deployment.yaml          # Deployment y Service de DBeaver
├── jenkins-deployment.yaml          # Deployment y Service de Jenkins
├── deploy.sh                          # Script de despliegue (Linux/Mac)
├── deploy.ps1                        # Script de despliegue (Windows)
└── README.md                         # Este archivo
```

## Despliegue Rápido

### Linux/Mac
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

### Windows (PowerShell)
```powershell
cd k8s
.\deploy.ps1
```

### Manual
```bash
# Aplicar en orden
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f grafana-configmap.yaml
kubectl apply -f postgresql-init-script-configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f postgresql-deployment.yaml
kubectl apply -f postgresql-service.yaml
# Esperar a que PostgreSQL esté listo
kubectl wait --for=condition=ready pod -l app=postgresql -n biblioteca-xonler --timeout=300s
# Ejecutar script de inicialización
kubectl apply -f postgresql-init-job.yaml
kubectl wait --for=condition=complete job/postgresql-init-job -n biblioteca-xonler --timeout=300s
kubectl apply -f postgres-exporter-deployment.yaml
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml
kubectl apply -f prometheus-deployment.yaml
kubectl apply -f grafana-deployment.yaml
kubectl apply -f cadvisor-daemonset.yaml
kubectl apply -f dbeaver-deployment.yaml
kubectl apply -f jenkins-deployment.yaml
```

## Configuración de la Imagen Docker

Antes de desplegar, asegúrate de que la imagen Docker esté disponible:

### Opción 1: Imagen Local (Desarrollo)
1. Construir la imagen:
   ```bash
   docker build -t biblioteca-xonler-main-app:latest .
   ```
2. El deployment ya está configurado con `imagePullPolicy: Never`

### Opción 2: Registry (Producción)
1. Construir y subir la imagen:
   ```bash
   docker build -t tu-registry/biblioteca-xonler:latest .
   docker push tu-registry/biblioteca-xonler:latest
   ```
2. Actualizar `app-deployment.yaml`:
   - Cambiar `image: tu-registry/biblioteca-xonler:latest`
   - Cambiar `imagePullPolicy: Always`
   - Configurar credenciales del registry si es privado

## Verificación

### Ver estado de los pods
```bash
kubectl get pods -n biblioteca-xonler
```

### Ver servicios
```bash
kubectl get svc -n biblioteca-xonler
```

### Ver logs
```bash
kubectl logs -n biblioteca-xonler <pod-name>
```

### Ver logs en tiempo real
```bash
kubectl logs -n biblioteca-xonler -f <pod-name>
```

## Acceso a los Servicios

Los servicios están expuestos mediante NodePort:

| Servicio | Puerto Interno | NodePort | URL |
|----------|---------------|----------|-----|
| Aplicación | 3000 | 30000 | http://localhost:30000 |
| Grafana | 3000 | 30001 | http://localhost:30001 |
| Prometheus | 9090 | 30090 | http://localhost:30090 |
| Jenkins | 8080 | 30088 | http://localhost:30088 |
| Jenkins Agent | 50000 | 30500 | Solo para agentes |
| cAdvisor | 8080 | 30080 | http://localhost:30080 |
| DBeaver | 8978 | 30978 | http://localhost:30978 |
| PostgreSQL | 5432 | - | Solo interno (ClusterIP) |

## Configuración de Secrets

**IMPORTANTE**: Los secrets en `secrets.yaml` contienen valores por defecto. **Debes cambiarlos en producción**:

1. Generar nuevos valores:
   ```bash
   # En Linux/Mac
   echo -n "tu-password-seguro" | base64
   
   # En Windows PowerShell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("tu-password-seguro"))
   ```

2. Actualizar `secrets.yaml` con los valores codificados

3. Aplicar:
   ```bash
   kubectl apply -f secrets.yaml
   ```

## Inicialización de la Base de Datos

La base de datos se inicializa automáticamente mediante un Job de Kubernetes (`postgresql-init-job.yaml`) que:

1. Espera a que PostgreSQL esté listo y saludable
2. Ejecuta el script SQL completo desde el ConfigMap `postgresql-init-script`
3. Crea todas las tablas, funciones, índices y datos iniciales

El Job se ejecuta automáticamente durante el despliegue. Si necesitas ejecutarlo manualmente:

```bash
# Ver estado del Job
kubectl get job postgresql-init-job -n biblioteca-xonler

# Ver logs del Job
kubectl logs -n biblioteca-xonler job/postgresql-init-job

# Re-ejecutar el Job (eliminar y volver a crear)
kubectl delete job postgresql-init-job -n biblioteca-xonler
kubectl apply -f postgresql-init-job.yaml
```

**Nota**: El Job tiene `ttlSecondsAfterFinished: 300`, por lo que se elimina automáticamente 5 minutos después de completarse.

## Dashboards de Grafana

Grafana se configura automáticamente con 3 dashboards pre-configurados:

1. **Node.js Application Metrics**: Métricas de la aplicación (HTTP requests, DB queries, CPU, memoria)
2. **PostgreSQL Database Metrics**: Métricas de PostgreSQL (conexiones, queries, cache hit ratio, locks)
3. **Container Metrics**: Métricas de contenedores (CPU, RAM, network, disk I/O)

Los dashboards se provisionan automáticamente desde el ConfigMap `grafana-dashboards` y están disponibles inmediatamente después de que Grafana inicie.

Para acceder:
1. Abre Grafana: http://localhost:30001
2. Inicia sesión con las credenciales del ConfigMap/Secret
3. Los dashboards aparecerán automáticamente en el menú "Dashboards"

## Escalado

### Escalar la aplicación
```bash
kubectl scale deployment app-deployment --replicas=3 -n biblioteca-xonler
```

### Ver réplicas actuales
```bash
kubectl get deployment app-deployment -n biblioteca-xonler
```

## Actualización de la Aplicación

### Actualizar imagen
```bash
# Si usas registry
kubectl set image deployment/app-deployment app=tu-registry/biblioteca-xonler:v2.0 -n biblioteca-xonler

# Ver el rollout
kubectl rollout status deployment/app-deployment -n biblioteca-xonler
```

### Rollback
```bash
kubectl rollout undo deployment/app-deployment -n biblioteca-xonler
```

## Eliminación

### Eliminar todo
```bash
kubectl delete namespace biblioteca-xonler
```

**Nota**: Esto eliminará todos los recursos, incluyendo los PersistentVolumes. Los datos se perderán a menos que uses `retain` en el StorageClass.

## Troubleshooting

### Pods no inician
```bash
# Ver eventos
kubectl get events -n biblioteca-xonler --sort-by='.lastTimestamp'

# Ver descripción del pod
kubectl describe pod <pod-name> -n biblioteca-xonler
```

### Problemas de conexión a la base de datos
- Verificar que PostgreSQL esté listo: `kubectl get pods -l app=postgresql -n biblioteca-xonler`
- Verificar el service: `kubectl get svc postgresql-service -n biblioteca-xonler`
- Ver logs de PostgreSQL: `kubectl logs -l app=postgresql -n biblioteca-xonler`

### Problemas con PersistentVolumes
- Verificar PVCs: `kubectl get pvc -n biblioteca-xonler`
- Verificar PVs: `kubectl get pv`
- Ver descripción: `kubectl describe pvc <pvc-name> -n biblioteca-xonler`

## Integración con Jenkins

Para automatizar el despliegue desde Jenkins, puedes:

1. Construir la imagen Docker
2. Subirla al registry
3. Actualizar el deployment con la nueva imagen
4. Verificar el rollout

Ejemplo en Jenkinsfile:
```groovy
stage('Deploy to K8s') {
  steps {
    sh 'kubectl set image deployment/app-deployment app=tu-registry/biblioteca-xonler:${BUILD_NUMBER} -n biblioteca-xonler'
    sh 'kubectl rollout status deployment/app-deployment -n biblioteca-xonler'
  }
}
```

## Notas Adicionales

- Los servicios se comunican usando nombres DNS de Kubernetes (ej: `postgresql-service.biblioteca-xonler.svc.cluster.local`)
- Los PersistentVolumes usarán el storage class por defecto del cluster
- cAdvisor requiere permisos privilegiados para acceder a métricas del host
- Para producción, considera usar Ingress en lugar de NodePort

