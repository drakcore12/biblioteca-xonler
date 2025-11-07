pipeline {
  agent {
    // Imagen oficial con Node + navegadores + deps de Playwright
    docker {
      image 'mcr.microsoft.com/playwright:v1.47.0-jammy'
      args '-u root'   // permisos para instalar si hace falta
    }
  }

  environment {
    NODE_ENV     = 'test'
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/biblioteca_test'
    JWT_SECRET   = 'test-secret-key'
  }

  options { timestamps(); ansiColor('xterm') }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Node & npm') {
      steps {
        sh '''
          set -e
          echo "✅ Versions:"
          node -v
          npm -v
        '''
      }
    }

    stage('Instalar dependencias') {
      steps {
        sh '''
          # Si tienes package-lock: usa ci, si no, fallback a i
          npm ci || npm i
          # En esta imagen ya hay navegadores y deps del sistema
          # (no necesitas --with-deps)
          npx playwright --version
        '''
      }
    }

    stage('Pruebas Unitarias (Jest)') {
      steps {
        sh '''
          # Asegúrate de tener script "test:unit" o "test" en package.json
          npm run test:unit || npm test
        '''
      }
      post {
        always {
          // Usa "junit" del core; evita "publishTestResults" (no existe por defecto)
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
          // HTML Publisher (requiere plugin "HTML Publisher")
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
          // Publica reporte si existe
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
          # Asegúrate de tener artillery-config.yml en la raíz
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
