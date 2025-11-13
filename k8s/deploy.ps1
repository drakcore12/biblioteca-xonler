# Script PowerShell para desplegar la aplicación Biblioteca Xonler en Kubernetes
# Uso: .\deploy.ps1

Write-Host "🚀 Desplegando Biblioteca Xonler en Kubernetes..." -ForegroundColor Green

# Aplicar en orden de dependencias
Write-Host "📦 Creando namespace..." -ForegroundColor Cyan
kubectl apply -f namespace.yaml

Write-Host "⚙️  Creando ConfigMaps..." -ForegroundColor Cyan
kubectl apply -f configmap.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f grafana-configmap.yaml
kubectl apply -f postgresql-init-script-configmap.yaml

Write-Host "🔐 Creando Secrets..." -ForegroundColor Cyan
# Verificar que existe secrets.yaml
if (-not (Test-Path secrets.yaml)) {
    Write-Host "⚠️  secrets.yaml no encontrado. Creando desde template..." -ForegroundColor Yellow
    if (Test-Path secrets.yaml.example) {
        Copy-Item secrets.yaml.example secrets.yaml
        Write-Host "✅ secrets.yaml creado desde template. POR FAVOR, edita los valores antes de continuar!" -ForegroundColor Yellow
        Write-Host "   Presiona Enter cuando hayas editado secrets.yaml, o Ctrl+C para cancelar..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "❌ Error: No se encontró secrets.yaml ni secrets.yaml.example" -ForegroundColor Red
        exit 1
    }
}
kubectl apply -f secrets.yaml

Write-Host "💾 Creando PersistentVolumeClaims..." -ForegroundColor Cyan
kubectl apply -f persistent-volumes.yaml

Write-Host "🐘 Desplegando PostgreSQL..." -ForegroundColor Cyan
kubectl apply -f postgresql-deployment.yaml
kubectl apply -f postgresql-service.yaml

Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgresql -n biblioteca-xonler --timeout=300s

Write-Host "🗄️  Ejecutando script de inicialización de base de datos..." -ForegroundColor Cyan
kubectl apply -f postgresql-init-job.yaml
Write-Host "⏳ Esperando a que el Job de inicialización complete..." -ForegroundColor Yellow
kubectl wait --for=condition=complete job/postgresql-init-job -n biblioteca-xonler --timeout=300s
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos inicializada correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  El Job de inicialización puede haber fallado. Verifica los logs:" -ForegroundColor Yellow
    Write-Host "   kubectl logs -n biblioteca-xonler job/postgresql-init-job" -ForegroundColor Yellow
}

Write-Host "📊 Desplegando PostgreSQL Exporter..." -ForegroundColor Cyan
kubectl apply -f postgres-exporter-deployment.yaml

Write-Host "🧭 Desplegando SonarQube..." -ForegroundColor Cyan
kubectl apply -f sonarqube-deployment.yaml
kubectl apply -f sonarqube-service.yaml
Write-Host "⏳ Esperando a que SonarQube esté listo..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/sonarqube -n biblioteca-xonler --timeout=300s

Write-Host "🌐 Desplegando aplicación Node.js..." -ForegroundColor Cyan
kubectl apply -f app-deployment.yaml

Write-Host "📈 Desplegando Prometheus..." -ForegroundColor Cyan
kubectl apply -f prometheus-deployment.yaml

Write-Host "📊 Desplegando Grafana..." -ForegroundColor Cyan
kubectl apply -f grafana-deployment.yaml

Write-Host "📦 Desplegando cAdvisor (DaemonSet)..." -ForegroundColor Cyan
kubectl apply -f cadvisor-daemonset.yaml

Write-Host "🗄️  Desplegando pgAdmin..." -ForegroundColor Cyan
kubectl apply -f pgadmin-deployment.yaml

Write-Host "🔧 Desplegando Jenkins..." -ForegroundColor Cyan
kubectl apply -f jenkins-deployment.yaml

Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Verificar el estado de los pods:" -ForegroundColor Yellow
Write-Host "   kubectl get pods -n biblioteca-xonler"
Write-Host ""
Write-Host "🌐 Servicios expuestos (NodePort):" -ForegroundColor Yellow
Write-Host "   - Aplicación:     http://localhost:30000"
Write-Host "   - Grafana:        http://localhost:30001"
Write-Host "   - Prometheus:     http://localhost:30090"
Write-Host "   - Jenkins:        http://localhost:30088"
Write-Host "   - cAdvisor:       http://localhost:30080"
Write-Host "   - pgAdmin:        http://localhost:30978"
Write-Host "   - SonarQube:      http://localhost:30900"
Write-Host ""
Write-Host "📊 Ver logs:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n biblioteca-xonler <pod-name>"
Write-Host ""
Write-Host "🗑️  Para eliminar todo:" -ForegroundColor Yellow
Write-Host "   kubectl delete namespace biblioteca-xonler"

