# Script para iniciar el servidor Node.js en Windows
# Este script puede ser ejecutado desde Jenkins usando SSH o PowerShell remoto

$ErrorActionPreference = "Stop"

# Cambiar al directorio del proyecto
$ProjectPath = "C:\Users\MIGUEL\Documents\Proyectos-Cursor\Biblioteca-Xonler-main"
Set-Location $ProjectPath

# Verificar si el servidor ya está corriendo
$process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe" }
if ($process) {
    Write-Host "⚠️  Servidor Node.js ya está corriendo (PID: $($process.Id))"
    Write-Host "   Para detenerlo: Stop-Process -Id $($process.Id)"
    exit 0
}

# Iniciar el servidor en segundo plano
Write-Host "🚀 Iniciando servidor Node.js..."
$env:NODE_ENV = "production"
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden -PassThru | Out-Null

# Esperar a que el servidor esté disponible
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Servidor iniciado correctamente en http://localhost:3000"
        }
    } catch {
        Write-Host "   Esperando servidor... ($attempt/$maxAttempts)"
    }
}

if (-not $serverReady) {
    Write-Host "❌ El servidor no respondió después de $($maxAttempts * 2) segundos"
    exit 1
}

Write-Host "✅ Servidor Node.js corriendo en http://localhost:3000"

