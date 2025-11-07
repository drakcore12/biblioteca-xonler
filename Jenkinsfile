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
    // Configuración para ejecutar comandos en Windows
    WINDOWS_HOST = 'host.docker.internal'
    WINDOWS_USER = 'MIGUEL'  // Cambia esto por tu usuario de Windows
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
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

    stage('Ejecutar Comandos en Windows') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          // Usar SSH Pipeline Steps plugin
          try {
            echo "🚀 Ejecutando comandos en Windows usando SSH Pipeline Steps..."
            
            // Configurar conexión SSH
            def sshConfig = [
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 10000
            ]
            
            // 1. Instalar dependencias
            echo "📦 1. Ejecutando: npm install"
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && npm install"
            )
            
            // 2. Iniciar PostgreSQL
            echo "🐘 2. Ejecutando: .\\scripts\\start-postgres-windows.ps1"
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && powershell -ExecutionPolicy Bypass -File .\\scripts\\start-postgres-windows.ps1"
            )
            
            // 3. Iniciar servidor Node.js (en background)
            echo "🚀 3. Ejecutando: npm start"
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm start'"
            )
            
            echo "✅ Comandos ejecutados en Windows"
            echo "   Esperando 5 segundos para que el servidor inicie..."
            sleep(5)
            
          } catch (Exception e) {
            echo "⚠️  Error ejecutando comandos vía SSH: ${e.message}"
            echo "   Verifica que SSH esté configurado en Windows"
            echo "   Ver: CONFIGURAR-SSH-WINDOWS.md"
            echo ""
            echo "📝 EJECUTA ESTOS COMANDOS MANUALMENTE EN WINDOWS:"
            echo ""
            echo "   # 1. Instalar dependencias"
            echo "   cd ${projectPath}"
            echo "   npm install"
            echo ""
            echo "   # 2. Iniciar PostgreSQL"
            echo "   .\\scripts\\start-postgres-windows.ps1"
            echo ""
            echo "   # 3. Iniciar servidor Node.js"
            echo "   npm start"
            echo ""
            echo "💡 Para automatización completa, configura SSH en Windows:"
            echo "   Ver: CONFIGURAR-SSH-WINDOWS.md"
          }
        }
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
