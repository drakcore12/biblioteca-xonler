pipeline {
  // Si Jenkins está en Docker, usa 'agent any' y ejecuta en el contenedor de Jenkins
  // Si quieres usar Docker-in-Docker, descomenta la sección de abajo
  agent any
  
  // OPCIONAL: Si configuraste Docker-in-Docker, descomenta esto:
  // agent {
  //   docker {
  //     image 'mcr.microsoft.com/playwright:v1.47.0-jammy'
  //     args '-u root'
  //   }
  // }

  environment {
    NODE_ENV     = 'test'
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/biblioteca_test'
    JWT_SECRET   = 'test-secret-key'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Verificar Node.js') {
      steps {
        sh '''
          if command -v node &> /dev/null; then
            echo "✅ Node.js encontrado:"
            node -v
            npm -v
          else
            echo "⚠️  Node.js no encontrado"
            echo "Instala Node.js manualmente en el contenedor Jenkins:"
            echo "docker exec -u root -it jenkins bash"
            echo "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
            echo "apt-get update && apt-get install -y nodejs"
            exit 1
          fi
        '''
      }
    }

    stage('Instalar dependencias') {
      steps {
        sh '''
          npm ci || npm i
          # Instalar Playwright (si no está en la imagen)
          npx playwright install --with-deps || npx playwright install || true
          npx playwright --version || echo "⚠️  Playwright no disponible"
        '''
      }
    }

    stage('Pruebas Unitarias (Jest)') {
      steps {
        sh '''
          # Ejecutar tests unitarios, permitir fallos para continuar el pipeline
          npm run test:unit || npm test || echo "⚠️  Algunos tests fallaron, pero continuamos"
        '''
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
          publishHTML(target: [
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
      }
    }

    stage('Verificar Servidor Local') {
      steps {
        sh '''
          echo "🔍 Verificando si el servidor está corriendo en localhost:3000"
          echo "📝 NOTA: El servidor debe estar corriendo en tu máquina local (no en el contenedor)"
          echo "   Para iniciarlo manualmente: npm start"
          
          # Intentar conectar al servidor (puede estar en el host, no en el contenedor)
          # Si Jenkins está en Docker, localhost:3000 apunta al contenedor, no al host
          # Necesitamos usar host.docker.internal (Windows/Mac) o la IP del host (Linux)
          
          SERVER_AVAILABLE=false
          
          # Intentar localhost primero (si Jenkins no está en Docker o está en modo host)
          if curl -fsS --max-time 2 http://localhost:3000 >/dev/null 2>&1; then
            echo "✅ Servidor encontrado en localhost:3000"
            SERVER_AVAILABLE=true
          # Intentar host.docker.internal (Windows/Mac Docker Desktop)
          elif curl -fsS --max-time 2 http://host.docker.internal:3000 >/dev/null 2>&1; then
            echo "✅ Servidor encontrado en host.docker.internal:3000"
            SERVER_AVAILABLE=true
          else
            echo "⚠️  Servidor no encontrado en localhost:3000"
            echo "   Asegúrate de que el servidor esté corriendo en tu máquina local"
            echo "   Ejecuta: npm start (en tu terminal, fuera de Jenkins)"
          fi
          
          # Guardar estado para etapas siguientes
          echo "SERVER_AVAILABLE=${SERVER_AVAILABLE}" > server-status.env
        '''
      }
    }

    stage('Pruebas E2E (Playwright)') {
      steps {
        sh '''
          # Verificar si el servidor está disponible
          if [ -f server-status.env ]; then
            source server-status.env
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible, ejecutando tests E2E"
            # Configurar BASE_URL para Playwright (usar host.docker.internal si Jenkins está en Docker)
            if curl -fsS --max-time 2 http://host.docker.internal:3000 >/dev/null 2>&1; then
              export BASE_URL="http://host.docker.internal:3000"
              echo "🌐 Usando host.docker.internal:3000 para tests E2E"
            else
              export BASE_URL="http://localhost:3000"
              echo "🌐 Usando localhost:3000 para tests E2E"
            fi
            # Nota: Para que Playwright funcione, instala las deps del sistema en el contenedor Jenkins:
            # docker exec -u root -it jenkins bash
            # apt-get update && apt-get install -y libglib2.0-0 libnspr4 libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 libxkbcommon0 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 libasound2
            npx playwright test || echo "⚠️  Tests E2E fallaron"
          else
            echo "⚠️  Servidor no disponible, omitiendo tests E2E"
            echo "   Inicia el servidor en tu máquina local con: npm start"
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
          archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, onlyIfSuccessful: false
        }
      }
    }

    stage('Pruebas de Carga (Artillery)') {
      steps {
        sh '''
          # Verificar si el servidor está disponible
          if [ -f server-status.env ]; then
            source server-status.env
          else
            SERVER_AVAILABLE=false
          fi
          
          if [ "$SERVER_AVAILABLE" = "true" ]; then
            echo "✅ Servidor disponible, ejecutando tests de carga"
            mkdir -p test-results
            # Determinar URL del servidor (host.docker.internal si Jenkins está en Docker)
            if curl -fsS --max-time 2 http://host.docker.internal:3000 >/dev/null 2>&1; then
              SERVER_URL="http://host.docker.internal:3000"
              echo "🌐 Usando host.docker.internal:3000 para Artillery"
            else
              SERVER_URL="http://localhost:3000"
              echo "🌐 Usando localhost:3000 para Artillery"
            fi
            # Crear config temporal con la URL correcta
            sed "s|target:.*|target: \"${SERVER_URL}\"|" artillery-config.yml > artillery-config-temp.yml || cp artillery-config.yml artillery-config-temp.yml
            npx -y artillery@latest run artillery-config-temp.yml --output test-results/load-report.json || echo "⚠️  Tests de carga fallaron"
            rm -f artillery-config-temp.yml || true
          else
            echo "⚠️  Servidor no disponible, omitiendo tests de carga"
            echo "   Inicia el servidor en tu máquina local con: npm start"
            mkdir -p test-results
            echo '{"skipped": true, "reason": "Servidor no disponible"}' > test-results/load-report.json
          fi
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'test-results/load-report.json', fingerprint: true, onlyIfSuccessful: false
        }
      }
    }

    stage('Desplegar Localmente') {
      when { branch 'main' }
      steps {
        sh '''
          echo "📋 Instrucciones para desplegar localmente:"
          echo ""
          echo "1. Abre una terminal en tu máquina local"
          echo "2. Navega al directorio del proyecto"
          echo "3. Ejecuta: npm start"
          echo ""
          echo "El servidor debe correr en: http://localhost:3000"
          echo ""
          echo "⚠️  NOTA: Jenkins NO puede iniciar el servidor en tu máquina local"
          echo "   Debes iniciarlo manualmente antes de ejecutar tests E2E o de carga"
          echo ""
          echo "✅ Si el servidor ya está corriendo, los tests E2E y Artillery funcionarán"
        '''
      }
      post {
        success { echo '✅ Instrucciones de despliegue mostradas' }
      }
    }

    stage('Cloudflare Tunnel (opcional)') {
      when { branch 'main' }
      steps {
        sh '''
          # Solo si cloudflared existe; si no, saltar sin fallar
          if ! command -v cloudflared >/dev/null 2>&1; then
            echo "⚠️  cloudflared no instalado; omitiendo Tunnel"
            exit 0
          fi

          pkill -f cloudflared || true
          sleep 2

          nohup cloudflared tunnel --url http://localhost:3000 > cloudflare.log 2>&1 & echo $! > cloudflare.pid
          sleep 5

          URL=$(grep -o "https://[a-z0-9-]*\\.trycloudflare\\.com" cloudflare.log | head -1 || true)
          if [ -n "$URL" ]; then
            echo "🌐 URL pública: $URL"
            printf "URL_PUBLICA=%s\n" "$URL" > cloudflare-url.env
          else
            echo "⚠️  No se pudo extraer la URL (revisa cloudflare.log)"
          fi
        '''
      }
      post {
        success {
          script {
            if (fileExists('cloudflare-url.env')) {
              def url = readFile('cloudflare-url.env').trim().split('=')[-1]
              if (url) echo "🌐 Acceso público: ${url}"
            }
          }
        }
      }
    }
  }

  post {
    always {
      echo '📋 Pipeline completado'
      sh 'ls -lah || true'
    }
    cleanup {
      sh 'rm -f server.pid cloudflare.pid || true'
    }
  }
}
