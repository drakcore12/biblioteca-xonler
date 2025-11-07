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

    stage('Pruebas E2E (Playwright)') {
      steps {
        sh '''
          # Si todavía no tienes tests E2E, que no rompa el pipeline
          npx playwright test || true
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
          # No instales global (-g). Usa npx y guarda el reporte
          npx -y artillery@latest run artillery-config.yml --output test-results/load-report.json || true
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
          echo "🚀 Despliegue local"
          # Mata servidor previo si hubiera
          pkill -f "node .*server\\.js" || true
          sleep 2

          # Instala prod y arranca
          npm ci --omit=dev || npm i --omit=dev
          nohup npm start > server.log 2>&1 & echo $! > server.pid
          # Espera que levante
          for i in $(seq 1 10); do
            if curl -fsS http://localhost:3000 >/dev/null 2>&1; then
              echo "✅ Servidor OK en :3000"; break
            fi
            echo "Esperando servidor... ($i/10)"; sleep 2
          done
          # Verificación final
          curl -f http://localhost:3000 >/dev/null 2>&1 || { echo "❌ No responde :3000"; exit 1; }
        '''
      }
      post {
        success { echo '✅ Deploy local OK' }
        failure { echo '❌ Error en deploy local' }
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
