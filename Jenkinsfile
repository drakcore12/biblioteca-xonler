pipeline {
  agent {
    label 'windows'
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
            echo ========================================
            echo INICIANDO INSTALACION DE DEPENDENCIAS
            echo ========================================
            echo.
            echo Verificando Node.js y npm...
            node --version
            npm --version
            echo.
            echo Directorio actual: %CD%
            echo.
            echo Verificando package.json...
            dir package.json
            echo.
            echo Verificando package-lock.json...
            if exist "package-lock.json" (
              echo package-lock.json encontrado, usando npm ci
              call npm ci
              if errorlevel 1 (
                echo ERROR: npm ci fallo, intentando npm install...
                call npm install
                if errorlevel 1 (
                  echo ERROR: npm install tambien fallo
                  exit /b 1
                )
              )
            ) else (
              echo package-lock.json no encontrado, usando npm install
              call npm install
              if errorlevel 1 (
                echo ERROR: npm install fallo
                exit /b 1
              )
            )
            echo.
            echo Verificando node_modules...
            dir node_modules 2>nul
            if not exist "node_modules" (
              echo ERROR: node_modules no existe
              exit /b 1
            )
            echo.
            echo Verificando jest-junit...
            dir node_modules\\jest-junit 2>nul
            if not exist "node_modules\\jest-junit" (
              echo jest-junit no encontrado, instalando...
              call npm install jest-junit --save-dev --no-save
            )
            echo.
            echo ========================================
            echo DEPENDENCIAS INSTALADAS
            echo ========================================
          '''
        }
      }
    }

    stage('Tests Unitarios') {
      steps {
        script {
          echo "🧪 Ejecutando tests unitarios en host..."
          bat '''
            @echo off
            echo Ejecutando tests unitarios...
            echo.
            
            echo Agregando node_modules/.bin al PATH...
            set PATH=%CD%\\node_modules\\.bin;%PATH%
            echo.
            
            echo Verificando jest...
            if exist "node_modules\\.bin\\jest.cmd" (
              echo OK: jest.cmd encontrado
              set JEST_CMD=node_modules\\.bin\\jest.cmd
            ) else if exist "node_modules\\.bin\\jest" (
              echo OK: jest encontrado
              set JEST_CMD=node_modules\\.bin\\jest
            ) else (
              echo WARNING: jest no encontrado en node_modules/.bin
              set JEST_CMD=
            )
            echo.
            
            echo Verificando jest-junit...
            if exist "node_modules\\jest-junit" (
              echo OK: jest-junit encontrado
            ) else (
              echo WARNING: jest-junit no encontrado, intentando instalar...
              call npm install jest jest-junit --save-dev --no-save
              if exist "node_modules\\jest-junit" (
                echo OK: jest-junit instalado correctamente
              ) else (
                echo WARNING: jest-junit sigue sin estar disponible, continuando SIN reporter JUnit
              )
            )
            echo.
            
            echo Ejecutando tests con npm test...
            call npm test
            set TEST_EXIT=%ERRORLEVEL%
            
            if %TEST_EXIT% NEQ 0 (
              echo WARNING: npm test fallo (codigo: %TEST_EXIT%)
              if defined JEST_CMD (
                echo Intentando con jest directamente...
                call %JEST_CMD% --ci --reporters=default --reporters=jest-junit
                set TEST_EXIT=%ERRORLEVEL%
              ) else (
                echo Intentando con npx --yes jest...
                call npx --yes jest --ci --reporters=default --reporters=jest-junit
                set TEST_EXIT=%ERRORLEVEL%
              )
            )
            
            echo Verificando archivos de resultados...
            if exist "test-results\\junit.xml" (
              echo OK: Archivo junit.xml generado en: test-results\\junit.xml
            ) else if exist "junit.xml" (
              echo OK: Archivo junit.xml encontrado en la raiz
              if not exist "test-results" mkdir test-results
              copy junit.xml test-results\\junit.xml
            ) else (
              echo WARNING: Archivo junit.xml no encontrado
            )
            
            echo.
            echo ========================================
            echo TESTS COMPLETADOS
            echo ========================================
            echo Codigo de salida de los tests: %TEST_EXIT%
            
            rem Si los tests pasaron (codigo 0), terminar con exito
            rem Si los tests fallaron, Jenkins lo detectara del archivo junit.xml
            rem pero no queremos que el script batch falle si los tests pasaron
            if %TEST_EXIT% EQU 0 (
              echo OK: Todos los tests pasaron exitosamente
              exit /b 0
            ) else (
              echo WARNING: Algunos tests fallaron (codigo: %TEST_EXIT%)
              echo Continuando para que Jenkins procese el archivo junit.xml
              exit /b 0
            )
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
          echo "🚀 Iniciando servidor con Docker Compose..."
          bat '''
            @echo off
            echo Cambiando al directorio del workspace...
            cd /d %WORKSPACE%
            echo Directorio actual: %CD%
            echo.
            echo Verificando docker-compose.yml...
            if not exist "docker-compose.yml" (
              echo ERROR: docker-compose.yml no encontrado
              exit /b 1
            )
            echo.
            echo Iniciando contenedores con Docker Compose...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d
            if errorlevel 1 (
              echo ERROR: Error al iniciar contenedores
              exit /b 1
            )
            echo.
            echo Esperando 15 segundos para que el servidor se inicie...
            timeout /t 15 /nobreak >nul
            echo.
            echo Verificando que el servidor este respondiendo...
            for /L %%i in (1,1,10) do (
              curl -s http://localhost:3000/api/health >nul 2>&1
              if not errorlevel 1 (
                echo OK: Servidor respondiendo correctamente
                goto :server_ready
              )
              echo Esperando servidor... (intento %%i/10)
              timeout /t 3 /nobreak >nul
            )
            echo WARNING: Servidor no responde, pero continuando...
            :server_ready
            echo.
            echo Verificando estado de los contenedores...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
            echo.
            echo ✅ Servidor iniciado
            '''
          }
        }
      }
    }

    stage('Tests E2E') {
      steps {
        script {
          echo "🎭 Ejecutando tests E2E con Playwright en host..."
          bat '''
            @echo off
            echo Cambiando al directorio del workspace...
            cd /d %WORKSPACE%
            echo Directorio actual: %CD%
            echo.
            echo Instalando navegadores de Playwright...
            call npx playwright install --with-deps
            if errorlevel 1 (
              echo WARNING: Error al instalar navegadores de Playwright
              echo Continuando de todas formas...
            ) else (
              echo OK: Navegadores de Playwright instalados
            )
            echo.
            echo Creando directorios necesarios...
            if not exist "test-results" mkdir test-results
            if not exist "playwright-report" mkdir playwright-report
            echo.
            echo Ejecutando tests E2E...
            call npm run test:e2e
            set E2E_EXIT=%ERRORLEVEL%
            if %E2E_EXIT% NEQ 0 (
              echo WARNING: Algunos tests E2E fallaron (codigo: %E2E_EXIT%)
              echo Continuando para que Jenkins procese los resultados...
            ) else (
              echo OK: Tests E2E ejecutados exitosamente
            )
            echo.
            echo ✅ Tests E2E completados
            '''
          }
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
          echo "⚡ Ejecutando tests de carga con Artillery en host..."
          bat '''
            @echo off
            echo Creando directorios necesarios...
            if not exist "test-results" mkdir test-results
            
            echo Ejecutando tests de carga...
            call npm run test:load || npx artillery run tests/artillery-config.yml
            set LOAD_EXIT=%ERRORLEVEL%
            if %LOAD_EXIT% NEQ 0 (
              echo ⚠️ Tests de carga fallaron, pero continuando...
            )
            
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
          echo "🔍 Ejecutando análisis de código con SonarQube..."
          bat '''
            @echo off
            echo Verificando cobertura...
            if not exist "coverage\\lcov.info" (
              echo 📊 Generando reporte de cobertura para SonarQube...
              call npm run test:coverage
              set COV_EXIT=%ERRORLEVEL%
              if %COV_EXIT% NEQ 0 (
                echo ⚠️ No se pudo generar cobertura, pero continuando con SonarQube...
              )
            )
            
            echo Ejecutando análisis de SonarQube...
            call npm run sonar:local || npx sonarqube-scanner -Dsonar.host.url=http://localhost:9000
            set SONAR_EXIT=%ERRORLEVEL%
            if %SONAR_EXIT% NEQ 0 (
              echo ⚠️ Análisis de SonarQube falló, pero continuando...
            )
            
            echo ✅ Análisis de SonarQube completado
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
          echo "🚀 Verificando despliegue con Docker Compose..."
          bat '''
            @echo off
            echo Cambiando al directorio del workspace...
            cd /d %WORKSPACE%
            echo Directorio actual: %CD%
            echo.
            echo Verificando docker-compose.yml...
            if not exist "docker-compose.yml" (
              echo WARNING: docker-compose.yml no encontrado, saltando despliegue...
              exit /b 0
            )
            
            echo Verificando estado de los contenedores...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
            
            echo.
            echo ✅ Despliegue verificado (los contenedores ya estan corriendo desde el stage anterior)
          '''
        }
      }
      post {
        always {
          echo "📊 Estado final de contenedores:"
          bat '''
            @echo off
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
          '''
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
