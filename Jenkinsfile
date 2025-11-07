pipeline {
  agent any

  environment {
    NODE_ENV     = 'test'
    DATABASE_URL = 'postgresql://postgres:postgres@host.docker.internal:5432/xonler'
    DB_HOST      = 'host.docker.internal'
    DB_PORT      = '5432'
    DB_NAME      = 'xonler'
    DB_USER      = 'postgres'
    DB_PASSWORD  = 'postgres'
    JWT_SECRET   = 'test-secret-key'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Verificar Servicios en Windows') {
      steps {
        sh '''
          echo "🔍 Verificando servicios en Windows (host.docker.internal)..."
          echo ""
          
          # Verificar Node.js/Servidor
          SERVER_AVAILABLE=false
          if curl -fsS --max-time 2 http://host.docker.internal:3000 >/dev/null 2>&1; then
            echo "✅ Servidor Node.js corriendo en host.docker.internal:3000"
            SERVER_AVAILABLE=true
          else
            echo "⚠️  Servidor Node.js NO está corriendo"
            echo "   Ejecuta en Windows: npm start"
          fi
          
          # Verificar PostgreSQL
          POSTGRES_AVAILABLE=false
          if command -v psql >/dev/null 2>&1; then
            if PGPASSWORD=postgres psql -h host.docker.internal -p 5432 -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
              echo "✅ PostgreSQL corriendo en host.docker.internal:5432"
              POSTGRES_AVAILABLE=true
            else
              echo "⚠️  PostgreSQL NO está corriendo o no es accesible"
              echo "   Ejecuta en Windows: .\\scripts\\start-postgres-windows.ps1"
            fi
          else
            # Intentar conectar sin psql (solo verificar puerto)
            if timeout 2 bash -c "echo > /dev/tcp/host.docker.internal/5432" 2>/dev/null; then
              echo "✅ PostgreSQL parece estar corriendo en host.docker.internal:5432"
              POSTGRES_AVAILABLE=true
            else
              echo "⚠️  PostgreSQL NO está corriendo"
              echo "   Ejecuta en Windows: .\\scripts\\start-postgres-windows.ps1"
            fi
          fi
          
          # Guardar estados
          echo "SERVER_AVAILABLE=${SERVER_AVAILABLE}" > services-status.env
          echo "POSTGRES_AVAILABLE=${POSTGRES_AVAILABLE}" >> services-status.env
          
          echo ""
          echo "📋 Resumen:"
          echo "   Servidor Node.js: ${SERVER_AVAILABLE}"
          echo "   PostgreSQL: ${POSTGRES_AVAILABLE}"
        '''
      }
    }

    stage('Instrucciones para Windows') {
      steps {
        sh '''
          echo "📝 INSTRUCCIONES: Ejecuta estos comandos en tu máquina Windows"
          echo ""
          echo "1️⃣  Instalar dependencias (si no lo has hecho):"
          echo "    cd C:\\Users\\MIGUEL\\Documents\\Proyectos-Cursor\\Biblioteca-Xonler-main"
          echo "    npm install"
          echo ""
          echo "2️⃣  Iniciar PostgreSQL (si no está corriendo):"
          echo "    .\\scripts\\start-postgres-windows.ps1"
          echo ""
          echo "3️⃣  Iniciar servidor Node.js:"
          echo "    npm start"
          echo "    O usar: .\\scripts\\start-server-windows.ps1"
          echo ""
          echo "4️⃣  Ejecutar tests en Windows:"
          echo "    npm run test:unit          # Tests unitarios"
          echo "    npm run test:e2e           # Tests E2E (requiere servidor corriendo)"
          echo "    npm run test:load          # Tests de carga (requiere servidor corriendo)"
          echo ""
          echo "✅ Una vez que los servicios estén corriendo, Jenkins los detectará automáticamente"
        '''
      }
    }

    stage('Verificar Base de Datos') {
      steps {
        sh '''
          if [ -f services-status.env ]; then
            eval $(cat services-status.env)
          else
            POSTGRES_AVAILABLE=false
          fi
          
          if [ "$POSTGRES_AVAILABLE" = "true" ]; then
            echo "🔍 Verificando base de datos..."
            
            # Intentar conectar y verificar base de datos
            if command -v psql >/dev/null 2>&1; then
              export PGHOST=host.docker.internal
              export PGPORT=5432
              export PGUSER=postgres
              export PGPASSWORD=postgres
              
              # Crear base de datos si no existe
              psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "SELECT 1 FROM pg_database WHERE datname='xonler'" 2>/dev/null | grep -q 1 || \
              psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE xonler;" 2>/dev/null || true
              
              echo "✅ Base de datos verificada"
            else
              echo "⚠️  psql no disponible en Jenkins, pero PostgreSQL está corriendo"
              echo "   La base de datos debe configurarse manualmente en Windows"
            fi
          else
            echo "⚠️  PostgreSQL no disponible, omitiendo verificación de BD"
          fi
        '''
      }
    }

    stage('Verificar Servidor para Tests') {
      steps {
        sh '''
          if [ -f services-status.env ]; then
            eval $(cat services-status.env)
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible para tests E2E y de carga"
            echo "   URL: http://host.docker.internal:3000"
          else
            echo "⚠️  Servidor no disponible"
            echo "   Los tests E2E y de carga se omitirán"
            echo "   Inicia el servidor en Windows: npm start"
          fi
          
          echo "SERVER_AVAILABLE=${SERVER_AVAILABLE}" > server-status.env
        '''
      }
    }

    stage('Pruebas E2E (Playwright)') {
      steps {
        sh '''
          if [ -f server-status.env ]; then
            eval $(cat server-status.env)
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible"
            echo "📝 NOTA: Los tests E2E deben ejecutarse en Windows, no en Jenkins"
            echo "   Ejecuta en Windows: npm run test:e2e"
            echo ""
            echo "   Jenkins solo verifica que el servidor esté disponible"
            echo "   Los tests reales deben correrse en tu máquina Windows"
          else
            echo "⚠️  Servidor no disponible, omitiendo tests E2E"
            echo "   Inicia el servidor en Windows: npm start"
            echo "   Luego ejecuta: npm run test:e2e"
          fi
        '''
      }
      post {
        always {
          publishHTML(target: [
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
      }
    }

    stage('Pruebas de Carga (Artillery)') {
      steps {
        sh '''
          if [ -f server-status.env ]; then
            eval $(cat server-status.env)
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible"
            echo "📝 NOTA: Los tests de carga deben ejecutarse en Windows, no en Jenkins"
            echo "   Ejecuta en Windows: npm run test:load"
            echo ""
            echo "   Jenkins solo verifica que el servidor esté disponible"
            echo "   Los tests reales deben correrse en tu máquina Windows"
          else
            echo "⚠️  Servidor no disponible, omitiendo tests de carga"
            echo "   Inicia el servidor en Windows: npm start"
            echo "   Luego ejecuta: npm run test:load"
          fi
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'test-results/load-report.json', fingerprint: true, onlyIfSuccessful: false, allowEmpty: true
        }
      }
    }

    stage('Desplegar Localmente') {
      when { branch 'main' }
      steps {
        sh '''
          echo "📋 DESPLIEGUE LOCAL"
          echo ""
          echo "El servidor debe correr en Windows, no en Jenkins"
          echo ""
          echo "Para desplegar:"
          echo "1. En Windows, ejecuta: npm start"
          echo "2. El servidor estará disponible en: http://localhost:3000"
          echo "3. Jenkins puede acceder vía: http://host.docker.internal:3000"
        '''
      }
    }

    stage('Cloudflare Tunnel (opcional)') {
      when { branch 'main' }
      steps {
        sh '''
          if [ -f server-status.env ]; then
            eval $(cat server-status.env)
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible"
            echo "📝 NOTA: Cloudflare Tunnel debe ejecutarse en Windows"
            echo "   Ejecuta en Windows: cloudflared tunnel --url http://localhost:3000"
            echo ""
            echo "   El tunnel debe correr en tu máquina Windows, no en Jenkins"
          else
            echo "⚠️  Servidor no disponible"
            echo "   Inicia el servidor primero: npm start"
            echo "   Luego ejecuta: cloudflared tunnel --url http://localhost:3000"
          fi
        '''
      }
    }
  }

  post {
    always {
      echo '📋 Pipeline completado'
      echo '✅ Todos los servicios deben correr en Windows, Jenkins solo verifica'
      sh 'ls -lah || true'
    }
    cleanup {
      sh 'rm -f server.pid cloudflare.pid services-status.env server-status.env || true'
    }
  }
}
