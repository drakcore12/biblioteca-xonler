# Script para ejecutar análisis de SonarQube con configuración correcta
# Uso: .\scripts\run-sonar-analysis.ps1

Write-Host "🔍 Ejecutando análisis de SonarQube..." -ForegroundColor Cyan
Write-Host ""

# Verificar que SonarQube esté funcionando
Write-Host "📡 Verificando conexión con SonarQube..." -ForegroundColor Cyan
try {
    $status = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ SonarQube está funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: SonarQube no está disponible en http://localhost:9000" -ForegroundColor Red
    Write-Host "   Inicia SonarQube con: docker-compose -f docker-compose.sonarqube.yml up -d" -ForegroundColor Yellow
    exit 1
}

# Verificar token
if (-not $env:SONAR_TOKEN) {
    Write-Host "⚠️  Variable SONAR_TOKEN no está configurada" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "   1. Configurar variable de entorno:" -ForegroundColor White
    Write-Host "      `$env:SONAR_TOKEN='tu_token_aqui'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Agregar al archivo .env:" -ForegroundColor White
    Write-Host "      SONAR_TOKEN=tu_token_aqui" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Agregar directamente en sonar-project.properties:" -ForegroundColor White
    Write-Host "      sonar.token=tu_token_aqui" -ForegroundColor Gray
    Write-Host ""
    
    $useDefault = Read-Host "¿Quieres usar usuario/contraseña (admin/admin) en su lugar? (s/n)"
    if ($useDefault -eq "s" -or $useDefault -eq "S") {
        $env:SONAR_LOGIN = "admin"
        $env:SONAR_PASSWORD = Read-Host "Ingresa la contraseña de admin (por defecto: admin)" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:SONAR_PASSWORD)
        $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        $env:SONAR_PASSWORD = $plainPassword
    } else {
        Write-Host "❌ Token requerido. Operación cancelada." -ForegroundColor Red
        exit 1
    }
}

# Configurar URL si no está configurada
if (-not $env:SONAR_HOST_URL) {
    $env:SONAR_HOST_URL = "http://localhost:9000"
}

# Generar cobertura primero
Write-Host ""
Write-Host "📊 Generando cobertura de tests..." -ForegroundColor Cyan
npm run test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar cobertura" -ForegroundColor Red
    exit 1
}

# Ejecutar análisis
Write-Host ""
Write-Host "🔍 Ejecutando análisis de SonarQube..." -ForegroundColor Cyan
Write-Host ""

npx sonarqube-scanner

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Análisis completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Ver resultados en:" -ForegroundColor Cyan
    Write-Host "   http://localhost:9000/dashboard?id=biblioteca-xonler" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error en el análisis" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   - Que SonarQube esté funcionando" -ForegroundColor White
    Write-Host "   - Que el token sea válido" -ForegroundColor White
    Write-Host "   - Que el proyecto exista en SonarQube" -ForegroundColor White
    Write-Host ""
    exit 1
}

