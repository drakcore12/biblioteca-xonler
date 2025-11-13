# Script de configuración rápida de SonarQube para Windows
# Uso: .\scripts\setup-sonarqube.ps1

Write-Host "🚀 Configurando SonarQube..." -ForegroundColor Green
Write-Host ""

# Verificar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker no está instalado" -ForegroundColor Red
    Write-Host "   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar Docker Compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker encontrado" -ForegroundColor Green
Write-Host ""

# Iniciar SonarQube
Write-Host "📦 Iniciando SonarQube con Docker Compose..." -ForegroundColor Cyan
docker-compose -f docker-compose.sonarqube.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar SonarQube" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Esperando a que SonarQube esté listo..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar 1-2 minutos..." -ForegroundColor Yellow

# Esperar a que SonarQube esté listo
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        # Continuar esperando
    }
    
    if ($attempt % 10 -eq 0) {
        Write-Host "   Intentando conectar... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if ($ready) {
    Write-Host ""
    Write-Host "✅ SonarQube está listo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Información de acceso:" -ForegroundColor Cyan
    Write-Host "   URL: http://localhost:9000" -ForegroundColor White
    Write-Host "   Usuario: admin" -ForegroundColor White
    Write-Host "   Contraseña: admin" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Cambia la contraseña en el primer inicio" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔑 Para obtener un token:" -ForegroundColor Cyan
    Write-Host "   1. Inicia sesión en http://localhost:9000" -ForegroundColor White
    Write-Host "   2. Ve a My Account > Security" -ForegroundColor White
    Write-Host "   3. Genera un nuevo token" -ForegroundColor White
    Write-Host "   4. Agrega el token a tu archivo .env:" -ForegroundColor White
    Write-Host "      SONAR_TOKEN=tu_token_aqui" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Para ejecutar análisis:" -ForegroundColor Cyan
    Write-Host "   npm run test:coverage" -ForegroundColor White
    Write-Host "   npm run sonar:local" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  SonarQube está iniciando pero aún no está listo" -ForegroundColor Yellow
    Write-Host "   Verifica manualmente en: http://localhost:9000" -ForegroundColor White
    Write-Host "   Puede tardar unos minutos más..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Ver logs:" -ForegroundColor Cyan
    Write-Host "   docker logs sonarqube" -ForegroundColor White
    Write-Host ""
}

