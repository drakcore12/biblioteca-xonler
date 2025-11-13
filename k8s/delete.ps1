# Script para ELIMINAR todos los recursos de Kubernetes en el namespace biblioteca-xonler
# ⚠️ ADVERTENCIA: Este script elimina TODO, incluyendo datos persistentes si se especifica
# Uso: .\k8s\delete.ps1 [--delete-pvc]

param(
    [switch]$DeletePVC = $false
)

Write-Host "🗑️  ELIMINANDO todos los recursos de Kubernetes..." -ForegroundColor Red
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
    Write-Host "   No hay nada que eliminar." -ForegroundColor Gray
    exit 0
}

# Confirmación
Write-Host "⚠️  ADVERTENCIA: Este script eliminará TODOS los recursos del namespace 'biblioteca-xonler'" -ForegroundColor Yellow
if ($DeletePVC) {
    Write-Host "⚠️  ADVERTENCIA: También se eliminarán los PersistentVolumeClaims (DATOS PERMANENTES)" -ForegroundColor Red
    Write-Host "   Esto incluye: base de datos PostgreSQL, datos de Grafana, datos de pgAdmin, etc." -ForegroundColor Red
}
Write-Host ""
$confirmation = Read-Host "¿Estás seguro de que quieres continuar? (escribe 'si' para confirmar)"
if ($confirmation -ne "si") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🗑️  Eliminando recursos..." -ForegroundColor Red
Write-Host ""

# Eliminar todos los deployments
Write-Host "🗑️  Eliminando deployments..." -ForegroundColor Yellow
kubectl delete deployment --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Deployments eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron deployments" -ForegroundColor Gray
}

# Eliminar todos los daemonsets
Write-Host "🗑️  Eliminando daemonsets..." -ForegroundColor Yellow
kubectl delete daemonset --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ DaemonSets eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron daemonsets" -ForegroundColor Gray
}

# Eliminar todos los jobs
Write-Host "🗑️  Eliminando jobs..." -ForegroundColor Yellow
kubectl delete job --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Jobs eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron jobs" -ForegroundColor Gray
}

# Eliminar todos los servicios
Write-Host "🗑️  Eliminando servicios..." -ForegroundColor Yellow
kubectl delete service --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Servicios eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron servicios" -ForegroundColor Gray
}

# Eliminar todos los configmaps
Write-Host "🗑️  Eliminando configmaps..." -ForegroundColor Yellow
kubectl delete configmap --all -n biblioteca-xonler 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ConfigMaps eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron configmaps" -ForegroundColor Gray
}

# Eliminar todos los secrets (excepto los del sistema)
Write-Host "🗑️  Eliminando secrets..." -ForegroundColor Yellow
kubectl delete secret --all -n biblioteca-xonler --field-selector type!=kubernetes.io/service-account-token 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Secrets eliminados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontraron secrets" -ForegroundColor Gray
}

# Eliminar PersistentVolumeClaims si se especifica
if ($DeletePVC) {
    Write-Host "🗑️  Eliminando PersistentVolumeClaims (DATOS PERMANENTES)..." -ForegroundColor Red
    kubectl delete pvc --all -n biblioteca-xonler 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PVCs eliminados (DATOS PERDIDOS)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  No se encontraron PVCs" -ForegroundColor Gray
    }
} else {
    Write-Host "ℹ️  PersistentVolumeClaims se mantienen (usa --DeletePVC para eliminarlos)" -ForegroundColor Cyan
}

# Eliminar cualquier otro recurso restante
Write-Host "🗑️  Eliminando otros recursos..." -ForegroundColor Yellow
kubectl delete all --all -n biblioteca-xonler 2>&1 | Out-Null

# Esperar un momento
Write-Host ""
Write-Host "⏳ Esperando a que los recursos se eliminen..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Verificar estado final
Write-Host ""
Write-Host "📊 Verificando estado final..." -ForegroundColor Cyan
Write-Host ""
kubectl get all -n biblioteca-xonler 2>&1

# Verificar si el namespace está vacío
$remainingResources = kubectl get all -n biblioteca-xonler --no-headers 2>&1
if ($LASTEXITCODE -ne 0 -or $remainingResources.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ Todos los recursos eliminados" -ForegroundColor Green
    
    if (-not $DeletePVC) {
        $pvcCount = (kubectl get pvc -n biblioteca-xonler --no-headers 2>&1 | Measure-Object -Line).Lines
        if ($pvcCount -gt 0) {
            Write-Host ""
            Write-Host "ℹ️  Aún quedan $pvcCount PersistentVolumeClaim(s) con datos" -ForegroundColor Cyan
            Write-Host "   Para eliminarlos también, ejecuta: .\k8s\delete.ps1 -DeletePVC" -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Algunos recursos aún existen" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host ""

