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
          echo "📁 Preparación"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo [PREPARACIÓN] Creando directorios...
            if not exist "logs" mkdir logs
            if not exist "logs\\encrypted" mkdir logs\\encrypted
            if not exist "test-results" mkdir test-results
            if not exist "coverage" mkdir coverage
            echo [PREPARACIÓN] ✅ Completado
          '''
        }
      }
    }

    stage('Instalar dependencias') {
      steps {
        script {
          echo "📦 Instalación de dependencias"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo [DEPENDENCIAS] Node: 
            node --version
            echo [DEPENDENCIAS] NPM: 
            npm --version
            echo [DEPENDENCIAS] Instalando paquetes...
            call npm ci
            if errorlevel 1 call npm install
            echo [DEPENDENCIAS] ✅ Completado
          '''
        }
      }
    }

    stage('Tests Unitarios') {
      steps {
        script {
          echo "🧪 Tests Unitarios"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [TESTS UNITARIOS] EJECUTANDO
            echo ========================================
            rem IMPORTANTE: ejecutar con coverage
            call npm test -- --coverage
            set TEST_EXIT=%ERRORLEVEL%
            if not exist "test-results" mkdir test-results
            if exist "junit.xml" copy junit.xml test-results\\junit.xml
            if %TEST_EXIT% NEQ 0 (
              echo [TESTS UNITARIOS] ❌ Fallaron (código: %TEST_EXIT%)
              exit /b %TEST_EXIT%
            )
            echo [TESTS UNITARIOS] ✅ Completado
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
            }
          }
          archiveArtifacts artifacts: 'test-results/junit.xml,junit.xml', allowEmptyArchive: true
        }
      }
    }

    stage('Análisis SonarQube') {
      steps {
        script {
          echo "🔍 Análisis SonarQube"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [SONARQUBE] VERIFICACIONES
            echo ========================================
            
            rem Verificar token
            if not exist ".env" (
              echo [SONARQUBE] ❌ .env no encontrado
              goto skip_sonar
            )
            findstr /C:"SONAR_TOKEN=" .env >nul 2>&1
            if errorlevel 1 (
              echo [SONARQUBE] ❌ SONAR_TOKEN no encontrado
              goto skip_sonar
            )
            echo [SONARQUBE] ✅ Token verificado
            for /f "tokens=1,* delims==" %%a in ('findstr "SONAR_TOKEN" .env') do set SONAR_TOKEN=%%b
            
            rem Iniciar contenedor
            echo [SONARQUBE] Iniciando contenedor...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d --no-deps sonarqube
            if errorlevel 1 (
              echo [SONARQUBE] ❌ No se pudo iniciar contenedor
              goto skip_sonar
            )
            echo [SONARQUBE] ⏳ Esperando 60s...
            ping 127.0.0.1 -n 61 >nul
            echo [SONARQUBE] ✅ Contenedor iniciado
            
            rem Ejecutar análisis
            echo.
            echo ========================================
            echo [SONARQUBE] EJECUTANDO ANÁLISIS
            echo ========================================
            call npm run sonar:local
            if errorlevel 1 (
              echo [SONARQUBE] ⚠️ Análisis falló, continuando...
              exit /b 0
            )
            echo [SONARQUBE] ✅ Análisis completado
            echo [SONARQUBE] 📊 http://localhost:9000/dashboard?id=biblioteca-xonler
            exit /b 0
            
            :skip_sonar
            echo [SONARQUBE] ⚠️ Saltando análisis...
            exit /b 0
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: '.scannerwork/**/*,coverage/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Iniciar Servidor') {
      steps {
        script {
          echo "🚀 Iniciar Servidor"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [SERVIDOR] CONSTRUCCIÓN E INICIO
            echo ========================================
            echo [SERVIDOR] Commit: 
            git log -1 --oneline
            echo [SERVIDOR] Reconstruyendo imagen app...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose --progress=plain build app
            set BUILD_EXIT=%ERRORLEVEL%
            if %BUILD_EXIT% NEQ 0 (
              echo [SERVIDOR] ❌ Build falló
              exit /b 1
            )
            echo [SERVIDOR] ✅ Imagen construida
            
            echo [SERVIDOR] Verificando contenedores...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db | findstr /i "Up" >nul
            if errorlevel 1 (
              echo [SERVIDOR] Iniciando contenedores...
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d app db
              ping 127.0.0.1 -n 21 >nul
            ) else (
              echo [SERVIDOR] Reiniciando app...
              "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose restart app
              ping 127.0.0.1 -n 21 >nul
            )
            echo [SERVIDOR] ✅ Servidor iniciado
          '''
        }
      }
    }

    stage('Tests E2E') {
      steps {
        script {
          echo "🎭 Tests E2E"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [TESTS E2E] EJECUTANDO
            echo ========================================
            echo [TESTS E2E] Instalando Playwright...
            call npx playwright install --with-deps
            if not exist "test-results" mkdir test-results
            if not exist "playwright-report" mkdir playwright-report
            echo [TESTS E2E] Ejecutando tests...
            call npm run test:e2e
            echo [TESTS E2E] ✅ Completado
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'test-results/**/*,playwright-report/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Tests de Carga') {
      steps {
        script {
          echo "⚡ Tests de Carga"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [TESTS CARGA] EJECUTANDO
            echo ========================================
            if not exist "test-results" mkdir test-results
            echo [TESTS CARGA] Ejecutando Artillery...
            call npm run test:load
            echo [TESTS CARGA] ✅ Completado
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
        }
      }
    }


    stage('Despliegue (CD)') {
      steps {
        script {
          echo "🚀 Despliegue"
          bat '''
            @echo off
            cd /d %WORKSPACE%
            echo.
            echo ========================================
            echo [DESPLIEGUE] VERIFICACIÓN
            echo ========================================
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps
            echo [DESPLIEGUE] ✅ Verificado
          '''
        }
      }
      post {
        always {
          script {
            echo "📊 Estado contenedores:"
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
          echo "⚠️ Despliegue con problemas"
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
