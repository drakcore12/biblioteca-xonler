# Script para detener todos los recursos de Kubernetes en el namespace biblioteca-xonler
# Uso: .\k8s\stop.ps1

Write-Host "🛑 Deteniendo todos los recursos de Kubernetes..." -ForegroundColor Yellow
Write-Host ""

# Verificar que kubectl esté disponible
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: kubectl no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar que el namespace existe
$namespaceExists = kubectl get namespace biblioteca-xonler -o name 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  El namespace 'biblioteca-xonler' no existe" -ForegroundColor Yellow
    Write-Host "   No hay nada que detener." -ForegroundColor Gray
    exit 0
}

# Detener todos los deployments
Write-Host "🛑 Deteniendo deployments..." -ForegroundColor Yellow
kubectl delete deployment --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Deployments detenidos" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron deployments o ya estaban detenidos" -ForegroundColor Gray
}

# Detener todos los daemonsets
Write-Host "🛑 Deteniendo daemonsets..." -ForegroundColor Yellow
kubectl delete daemonset --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ DaemonSets detenidos" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron daemonsets o ya estaban detenidos" -ForegroundColor Gray
}

# Detener todos los jobs
Write-Host "🛑 Deteniendo jobs..." -ForegroundColor Yellow
kubectl delete job --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Jobs detenidos" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron jobs o ya estaban detenidos" -ForegroundColor Gray
}

# Esperar un momento para que los pods se terminen
Write-Host ""
Write-Host "⏳ Esperando a que los pods se terminen..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Verificar que todo esté detenido
Write-Host ""
Write-Host "📊 Verificando estado final..." -ForegroundColor Cyan
Write-Host ""
kubectl get all -n biblioteca-xonler

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Nota: Los servicios, configmaps, secrets y PVCs se mantienen." -ForegroundColor Gray
Write-Host "   Para eliminarlos también, usa: kubectl delete all --all -n biblioteca-xonler" -ForegroundColor Gray
Write-Host ""

