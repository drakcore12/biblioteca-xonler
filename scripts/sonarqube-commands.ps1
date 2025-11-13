# Script de ayuda para comandos de SonarQube
# Uso: .\scripts\sonarqube-commands.ps1 [comando]

$DOCKER_PATH = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

function Show-Help {
    Write-Host "📋 Comandos de SonarQube:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Ver estado:" -ForegroundColor Yellow
    Write-Host "    .\scripts\sonarqube-commands.ps1 status" -ForegroundColor White
    Write-Host ""
    Write-Host "  Ver logs:" -ForegroundColor Yellow
    Write-Host "    .\scripts\sonarqube-commands.ps1 logs" -ForegroundColor White
    Write-Host ""
    Write-Host "  Detener:" -ForegroundColor Yellow
    Write-Host "    .\scripts\sonarqube-commands.ps1 stop" -ForegroundColor White
    Write-Host ""
    Write-Host "  Iniciar:" -ForegroundColor Yellow
    Write-Host "    .\scripts\sonarqube-commands.ps1 start" -ForegroundColor White
    Write-Host ""
    Write-Host "  Reiniciar:" -ForegroundColor Yellow
    Write-Host "    .\scripts\sonarqube-commands.ps1 restart" -ForegroundColor White
    Write-Host ""
}

$command = $args[0]

switch ($command) {
    "status" {
        Write-Host "📊 Estado de SonarQube:" -ForegroundColor Cyan
        & $DOCKER_PATH ps --filter "name=sonarqube" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    }
    "logs" {
        Write-Host "📋 Logs de SonarQube (últimas 50 líneas):" -ForegroundColor Cyan
        & $DOCKER_PATH logs sonarqube --tail 50
    }
    "stop" {
        Write-Host "🛑 Deteniendo SonarQube..." -ForegroundColor Yellow
        & $DOCKER_PATH compose -f docker-compose.sonarqube.yml down
    }
    "start" {
        Write-Host "🚀 Iniciando SonarQube..." -ForegroundColor Green
        & $DOCKER_PATH compose -f docker-compose.sonarqube.yml up -d
    }
    "restart" {
        Write-Host "🔄 Reiniciando SonarQube..." -ForegroundColor Yellow
        & $DOCKER_PATH compose -f docker-compose.sonarqube.yml restart
    }
    default {
        Show-Help
    }
}

