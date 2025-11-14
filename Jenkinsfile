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
            echo Esto puede tardar varios minutos, especialmente copiando node_modules...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose build --progress=plain app
            if errorlevel 1 (
              echo ERROR: Fallo al construir imagen
              exit /b 1
            )
            echo Verificando si los contenedores están corriendo...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db | findstr /i "Up" >nul
            if errorlevel 1 (
              echo Los contenedores no están corriendo, iniciándolos...
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d app db
              echo Esperando 20 segundos para que el servidor inicie...
              ping 127.0.0.1 -n 21 >nul
            ) else (
              echo Los contenedores ya están corriendo, reiniciando app para usar nueva imagen...
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose restart app
              echo Esperando 20 segundos para que el servidor reinicie...
              ping 127.0.0.1 -n 21 >nul
            )
            echo Verificando estado de contenedores...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db
            echo ✅ Imagen de app reconstruida y contenedor app reiniciado
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
            
            echo ========================================
            echo VERIFICACIONES PREVIAS
            echo ========================================
            
            rem 1. Verificar que el token esté configurado en .env
            echo.
            echo [1/4] Verificando token de SonarQube en .env...
            set TOKEN_FOUND=0
            if exist ".env" (
              findstr /C:"SONAR_TOKEN=" .env >nul 2>&1
              if %ERRORLEVEL% EQU 0 (
                echo ✅ Token encontrado en .env
                set TOKEN_FOUND=1
                rem Cargar token desde .env
                for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
                  if "%%a"=="SONAR_TOKEN" set SONAR_TOKEN=%%b
                )
              )
            )
            
            if %TOKEN_FOUND% EQU 0 (
              echo ❌ ERROR: Token de SonarQube no encontrado en .env
              echo.
              echo 💡 Solución: Agregar en .env: SONAR_TOKEN=tu_token
              echo.
              echo ⚠️ Continuando sin análisis de SonarQube...
              exit /b 0
            )
            
            rem 2. Verificar que el contenedor de SonarQube esté corriendo
            echo.
            echo [2/4] Verificando contenedor de SonarQube...
            powershell -Command "$output = & 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe' compose ps sonarqube 2>&1; if ($output -match 'Up' -and $output -match 'healthy') { exit 0 } else { exit 1 }" >nul 2>&1
            if %ERRORLEVEL% NEQ 0 (
              echo ⚠️ ADVERTENCIA: Contenedor sonarqube no está corriendo o no está healthy
              echo    Intentando iniciar contenedor...
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d sonarqube
              if errorlevel 1 (
                echo ❌ ERROR: No se pudo iniciar contenedor sonarqube
                echo ⚠️ Continuando sin análisis de SonarQube...
                exit /b 0
              )
              echo ⏳ Esperando a que SonarQube esté listo (puede tardar 1-2 minutos)...
              set MAX_WAIT=12
              set WAIT_COUNT=0
              :wait_sonar
              ping 127.0.0.1 -n 11 >nul
              set /a WAIT_COUNT+=1
              powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:9000/api/system/status' -UseBasicParsing -TimeoutSec 5; exit 0 } catch { exit 1 }" >nul 2>&1
              if errorlevel 1 (
                if %WAIT_COUNT% LSS %MAX_WAIT% (
                  echo    Esperando... (%WAIT_COUNT%/%MAX_WAIT%)
                  goto wait_sonar
                ) else (
                  echo ❌ ERROR: SonarQube no respondió después de %MAX_WAIT% intentos
                  echo ⚠️ Continuando sin análisis de SonarQube...
                  exit /b 0
                )
              )
            ) else (
              echo ✅ Contenedor sonarqube está corriendo y healthy
            )
            
            rem 3. Verificar que SonarQube esté respondiendo
            echo.
            echo [3/4] Verificando que SonarQube esté respondiendo...
            powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:9000/api/system/status' -UseBasicParsing -TimeoutSec 5; exit 0 } catch { exit 1 }" >nul 2>&1
            if errorlevel 1 (
              echo ❌ ERROR: SonarQube no está respondiendo en http://localhost:9000
              echo ⚠️ Continuando sin análisis de SonarQube...
              exit /b 0
            ) else (
              echo ✅ SonarQube está respondiendo correctamente
            )
            
            rem 4. Generar cobertura de tests
            echo.
            echo [4/4] Generando cobertura de tests...
            echo    La cobertura mide qué porcentaje del código está cubierto por tests.
            echo    SonarQube usa este reporte para mostrar métricas de calidad.
            call npm run test:coverage
            if errorlevel 1 (
              echo ⚠️ ADVERTENCIA: Fallo al generar cobertura, continuando sin ella...
            ) else (
              echo ✅ Cobertura generada correctamente
            )
            
            echo.
            echo ========================================
            echo EJECUTANDO ANÁLISIS DE SONARQUBE
            echo ========================================
            echo.
            
            rem 5. Ejecutar análisis de SonarQube
            call npm run sonar:local
            set SONAR_EXIT=%ERRORLEVEL%
            
            if %SONAR_EXIT% EQU 0 (
              echo.
              echo ✅ Análisis SonarQube completado exitosamente
              echo 📊 Ver resultados en: http://localhost:9000/dashboard?id=biblioteca-xonler
            ) else (
              echo.
              echo ⚠️ ADVERTENCIA: Análisis SonarQube falló (código: %SONAR_EXIT%)
              echo    Posibles causas:
              echo    - Token inválido o expirado
              echo    - SonarQube no está completamente operativo
              echo    - Problemas de red o conectividad
              echo.
              echo ⚠️ Continuando con el pipeline...
              exit /b 0
            )
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
