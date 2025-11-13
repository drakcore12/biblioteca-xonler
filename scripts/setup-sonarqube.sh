#!/bin/bash
# Script de configuración rápida de SonarQube para Linux/Mac
# Uso: ./scripts/setup-sonarqube.sh

echo "🚀 Configurando SonarQube..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "   Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Iniciar SonarQube
echo "📦 Iniciando SonarQube con Docker Compose..."
docker-compose -f docker-compose.sonarqube.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar SonarQube"
    exit 1
fi

echo ""
echo "⏳ Esperando a que SonarQube esté listo..."
echo "   Esto puede tardar 1-2 minutos..."

# Esperar a que SonarQube esté listo
max_attempts=60
attempt=0
ready=false

while [ $attempt -lt $max_attempts ] && [ "$ready" = false ]; do
    sleep 2
    attempt=$((attempt + 1))
    
    if curl -s http://localhost:9000/api/system/status > /dev/null 2>&1; then
        ready=true
    fi
    
    if [ $((attempt % 10)) -eq 0 ]; then
        echo "   Intentando conectar... ($attempt/$max_attempts)"
    fi
done

if [ "$ready" = true ]; then
    echo ""
    echo "✅ SonarQube está listo!"
    echo ""
    echo "📋 Información de acceso:"
    echo "   URL: http://localhost:9000"
    echo "   Usuario: admin"
    echo "   Contraseña: admin"
    echo ""
    echo "⚠️  IMPORTANTE: Cambia la contraseña en el primer inicio"
    echo ""
    echo "🔑 Para obtener un token:"
    echo "   1. Inicia sesión en http://localhost:9000"
    echo "   2. Ve a My Account > Security"
    echo "   3. Genera un nuevo token"
    echo "   4. Agrega el token a tu archivo .env:"
    echo "      SONAR_TOKEN=tu_token_aqui"
    echo ""
    echo "📊 Para ejecutar análisis:"
    echo "   npm run test:coverage"
    echo "   npm run sonar:local"
    echo ""
else
    echo ""
    echo "⚠️  SonarQube está iniciando pero aún no está listo"
    echo "   Verifica manualmente en: http://localhost:9000"
    echo "   Puede tardar unos minutos más..."
    echo ""
    echo "📋 Ver logs:"
    echo "   docker logs sonarqube"
    echo ""
fi

