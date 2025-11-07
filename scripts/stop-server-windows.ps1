# Script para detener el servidor Node.js en Windows

$ErrorActionPreference = "Stop"

# Buscar procesos de Node.js relacionados con el servidor
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe" -and 
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*server.js*"
}

if ($processes) {
    Write-Host "🛑 Deteniendo servidor Node.js..."
    foreach ($proc in $processes) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   Proceso $($proc.Id) detenido"
    }
    Write-Host "✅ Servidor detenido"
} else {
    Write-Host "⚠️  No se encontró ningún servidor Node.js corriendo"
}

