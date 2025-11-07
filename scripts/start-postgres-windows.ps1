# Script para iniciar PostgreSQL en Windows (si está instalado como servicio)

$ErrorActionPreference = "Stop"

# Verificar si PostgreSQL está instalado como servicio
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "🔍 Servicio PostgreSQL encontrado: $($service.Name)"
    
    if ($service.Status -eq "Running") {
        Write-Host "✅ PostgreSQL ya está corriendo"
        exit 0
    }
    
    Write-Host "🚀 Iniciando servicio PostgreSQL..."
    Start-Service -Name $service.Name
    
    # Esperar a que el servicio esté corriendo
    $service.WaitForStatus("Running", (New-TimeSpan -Seconds 30))
    
    if ($service.Status -eq "Running") {
        Write-Host "✅ PostgreSQL iniciado correctamente"
    } else {
        Write-Host "❌ No se pudo iniciar PostgreSQL"
        exit 1
    }
} else {
    Write-Host "⚠️  PostgreSQL no está instalado como servicio en Windows"
    Write-Host "   Instala PostgreSQL o úsalo en Docker:"
    Write-Host "   docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15"
    exit 0
}

