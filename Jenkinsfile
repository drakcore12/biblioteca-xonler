pipeline {
  agent {
    node {
      label 'windows'
      customWorkspace 'C:\\Users\\MIGUEL\\Documents\\Proyectos-Cursor\\biblioteca-xonler-main'
    }
  }

  environment {
    // Variables de SonarQube
    SONAR_HOST_URL = 'http://localhost:9000'
    // Variables de base de datos (para tests en host)
    DB_NAME = "${env.DB_NAME ?: 'xonler'}"
    DB_USER = "${env.DB_USER ?: 'postgres'}"
    DB_PASSWORD = "${env.DB_PASSWORD ?: 'postgres'}"
    DB_HOST = "${env.DB_HOST ?: 'localhost'}"
    DB_PORT = "${env.DB_PORT ?: '5432'}"
    PORT = "${env.PORT ?: '3000'}"
    NODE_ENV = 'test'
  }

  stages {
    stage('Preparación') {
      steps {
        script {
          echo "📁 Preparando workspace..."
          bat '''
            @echo off
            echo Verificando directorio de trabajo...
            cd /d %WORKSPACE%
            echo Directorio actual: %CD%
            
            echo Creando directorios necesarios...
            if not exist "logs" mkdir logs
            if not exist "logs\\encrypted" mkdir logs\\encrypted
            if not exist "test-results" mkdir test-results
            if not exist "coverage" mkdir coverage
            
            echo ✅ Preparación completada
          '''
        }
      }
    }

    stage('Instalar dependencias') {
      steps {
        script {
          echo "📦 Instalando dependencias..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            node --version
            npm --version
            call npm ci
            if errorlevel 1 call npm install
            echo ✅ Dependencias instaladas
          '''
        }
      }
    }

        stage('Tests Unitarios') {
          steps {
            script {
          echo "🧪 Ejecutando tests unitarios..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            call npm test
            set TEST_EXIT=%ERRORLEVEL%
            if not exist "test-results" mkdir test-results
            if exist "junit.xml" copy junit.xml test-results\\junit.xml
            if %TEST_EXIT% NEQ 0 (
              echo ERROR: Tests unitarios fallaron con codigo %TEST_EXIT%
              exit /b %TEST_EXIT%
            )
            echo ✅ Tests unitarios completados exitosamente
              '''
            }
          }
          post {
            always {
              script {
                def junitFile = 'test-results/junit.xml'
                if (fileExists(junitFile)) {
                  junit junitFile
                } else if (fileExists('junit.xml')) {
                  junit 'junit.xml'
                } else {
                  echo "⚠️ No se encontró archivo junit.xml para publicar"
                }
              }
              archiveArtifacts artifacts: 'test-results/junit.xml,junit.xml', allowEmptyArchive: true
        }
      }
    }

    stage('Iniciar Servidor') {
      steps {
        script {
          echo "🚀 Iniciando servidor..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo Commit actual del repositorio:
            git log -1 --oneline
            echo.
            echo Reconstruyendo imagen de app con codigo fresco...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose build app
            echo Deteniendo y eliminando contenedores app y db...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose rm -f -s app db 2>nul
            echo Eliminando contenedores directamente si existen...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" stop pg-main web-app 2>nul
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" rm -f pg-main web-app 2>nul
            echo Creando contenedores app y db de cero...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d app db
            echo Esperando 20 segundos para que el servidor inicie...
            ping 127.0.0.1 -n 21 >nul
            echo Verificando estado de contenedores...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db
            echo ✅ Servidor iniciado con codigo actualizado
          '''
        }
      }
    }

        stage('Tests E2E') {
          steps {
            script {
          echo "🎭 Ejecutando tests E2E..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            call npx playwright install --with-deps
            if not exist "test-results" mkdir test-results
            if not exist "playwright-report" mkdir playwright-report
            call npm run test:e2e
            echo ✅ Tests E2E completados
              '''
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'test-results/**/*,playwright-report/**/*', allowEmptyArchive: true
          // publishHTML requiere plugin HTML Publisher - comentado por ahora
          // publishHTML([
          //   reportDir: 'playwright-report',
          //   reportFiles: 'index.html',
          //   reportName: 'Playwright Report',
          //   keepAll: true
          // ])
            }
          }
        }

        stage('Tests de Carga') {
          steps {
            script {
          echo "⚡ Ejecutando tests de carga..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            if not exist "test-results" mkdir test-results
            call npm run test:load
            echo ✅ Tests de carga completados
              '''
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Análisis SonarQube') {
      steps {
        script {
          echo "🔍 Ejecutando análisis SonarQube..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            if not exist "coverage\\lcov.info" call npm run test:coverage
            call npm run sonar:local
            echo ✅ Análisis SonarQube completado
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: '.scannerwork/**/*,coverage/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Despliegue (CD)') {
      steps {
        script {
          echo "🚀 Verificando despliegue..."
          bat '''
            @echo off
            cd /d %WORKSPACE%
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
            echo ✅ Despliegue verificado
          '''
        }
      }
      post {
        always {
          script {
            echo "📊 Estado final de contenedores:"
            bat '''
              @echo off
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
            '''
          }
        }
        success {
          echo "✅ Despliegue exitoso"
        }
        failure {
          echo "⚠️ Despliegue tuvo problemas, pero pipeline continúa"
        }
      }
    }
  }

  post {
    always {
      echo "✅ Pipeline completado"
      archiveArtifacts artifacts: 'test-results/**/*,junit.xml,playwright-report/**/*,coverage/**/*,.scannerwork/**/*', allowEmptyArchive: true
    }
    success {
      echo "✅ Pipeline terminó exitosamente"
    }
    failure {
      echo "❌ Pipeline falló - revisar logs"
    }
  }
}
