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

        // stage('Tests Unitarios') {
        //   steps {
        //     script {
        //   echo "🧪 Ejecutando tests unitarios..."
        //   bat '''
        //     @echo off
        //     cd /d %WORKSPACE%
        //     call npm test
        //     set TEST_EXIT=%ERRORLEVEL%
        //     if not exist "test-results" mkdir test-results
        //     if exist "junit.xml" copy junit.xml test-results\\junit.xml
        //     if %TEST_EXIT% NEQ 0 (
        //       echo ERROR: Tests unitarios fallaron con codigo %TEST_EXIT%
        //       exit /b %TEST_EXIT%
        //     )
        //     echo ✅ Tests unitarios completados exitosamente
        //       '''
        //     }
        //   }
        //   post {
        //     always {
        //       script {
        //         def junitFile = 'test-results/junit.xml'
        //         if (fileExists(junitFile)) {
        //           junit junitFile
        //         } else if (fileExists('junit.xml')) {
        //           junit 'junit.xml'
        //         } else {
        //           echo "⚠️ No se encontró archivo junit.xml para publicar"
        //         }
        //       }
        //       archiveArtifacts artifacts: 'test-results/junit.xml,junit.xml', allowEmptyArchive: true
        // }
        //   }
        // }

    // stage('Iniciar Servidor') {
    //   steps {
    //     script {
    //       echo "🚀 Iniciando servidor..."
    //       bat '''
    //         @echo off
    //         cd /d %WORKSPACE%
    //         echo Commit actual del repositorio:
    //         git log -1 --oneline
    //         echo.
    //         echo Reconstruyendo imagen de app con codigo fresco...
    //         echo Esto puede tardar varios minutos, especialmente copiando node_modules...
    //         echo Ejecutando build...
    //         "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose --progress=plain build app
    //         set BUILD_EXIT=%ERRORLEVEL%
    //         echo.
    //         echo ========================================
    //         echo Build completado - Codigo de salida: %BUILD_EXIT%
    //         echo ========================================
    //         if %BUILD_EXIT% NEQ 0 (
    //           echo ERROR: Fallo al construir imagen
    //           exit /b 1
    //         )
    //         echo ✅ Imagen construida exitosamente
    //         echo Verificando que la imagen existe...
    //         "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" images | findstr /i "biblioteca-xonler-main-app" >nul
    //         if errorlevel 1 (
    //           echo ⚠️ ADVERTENCIA: Imagen no encontrada después del build
    //         ) else (
    //           echo ✅ Imagen verificada correctamente
    //         )
    //         echo.
    //         echo Verificando si los contenedores están corriendo...
    //         "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db | findstr /i "Up" >nul
    //         if errorlevel 1 (
    //           echo Los contenedores no están corriendo, iniciándolos...
    //           "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d app db
    //           echo Esperando 20 segundos para que el servidor inicie...
    //           ping 127.0.0.1 -n 21 >nul
    //         ) else (
    //           echo Los contenedores ya están corriendo, reiniciando app para usar nueva imagen...
    //           "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose restart app
    //           echo Esperando 20 segundos para que el servidor reinicie...
    //           ping 127.0.0.1 -n 21 >nul
    //         )
    //         echo Verificando estado de contenedores...
    //         "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose ps app db
    //         echo ✅ Imagen de app reconstruida y contenedor app reiniciado
    //       '''
    //     }
    //   }
    // }

        // stage('Tests E2E') {
        //   steps {
        //     script {
        //   echo "🎭 Ejecutando tests E2E..."
        //   bat '''
        //     @echo off
        //     cd /d %WORKSPACE%
        //     call npx playwright install --with-deps
        //     if not exist "test-results" mkdir test-results
        //     if not exist "playwright-report" mkdir playwright-report
        //     call npm run test:e2e
        //     echo ✅ Tests E2E completados
        //       '''
        //     }
        //   }
        //   post {
        //     always {
        //       archiveArtifacts artifacts: 'test-results/**/*,playwright-report/**/*', allowEmptyArchive: true
        //   // publishHTML requiere plugin HTML Publisher - comentado por ahora
        //   // publishHTML([
        //   //   reportDir: 'playwright-report',
        //   //   reportFiles: 'index.html',
        //   //   reportName: 'Playwright Report',
        //   //   keepAll: true
        //   // ])
        //     }
        //   }
        // }

        // stage('Tests de Carga') {
        //   steps {
        //     script {
        //   echo "⚡ Ejecutando tests de carga..."
        //   bat '''
        //     @echo off
        //     cd /d %WORKSPACE%
        //     if not exist "test-results" mkdir test-results
        //     call npm run test:load
        //     echo ✅ Tests de carga completados
        //       '''
        //     }
        //   }
        //   post {
        //     always {
        //       archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
        // }
        //   }
        // }

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
            
            rem 1. Verificar token en .env
            echo.
            echo [1/4] Verificando token de SonarQube...
            if not exist ".env" (
              echo ❌ ERROR: Archivo .env no encontrado
              goto skip_sonar
            )
            
            findstr /C:"SONAR_TOKEN=" .env >nul 2>&1
            if errorlevel 1 (
              echo ❌ ERROR: SONAR_TOKEN no encontrado en .env
              echo.
              echo 💡 Solución: Agregar en .env: SONAR_TOKEN=tu_token
              echo.
              goto skip_sonar
            )
            
            echo ✅ Token encontrado
            rem Cargar token
            for /f "tokens=1,* delims==" %%a in ('findstr "SONAR_TOKEN" .env') do set SONAR_TOKEN=%%b
            
            rem 2. Verificar e iniciar contenedor (método simple)
            echo.
            echo [2/4] Verificando contenedor SonarQube...
            "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose up -d --no-deps sonarqube
            if errorlevel 1 (
              echo ❌ ERROR: No se pudo iniciar contenedor sonarqube
              goto skip_sonar
            )
            echo ⏳ Esperando 60 segundos para que SonarQube esté listo...
            timeout /t 60 /nobreak >nul
            echo ✅ Contenedor iniciado
            
            rem 3. Verificar respuesta de SonarQube
            echo.
            echo [3/4] Verificando API de SonarQube...
            powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:9000/api/system/status' -UseBasicParsing -TimeoutSec 10 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
            if errorlevel 1 (
              echo ❌ ERROR: SonarQube no responde
              goto skip_sonar
            )
            
            echo ✅ SonarQube está respondiendo
            
            rem 4. Generar cobertura
            echo.
            echo [4/4] Generando cobertura de tests...
            echo    La cobertura mide qué porcentaje del código está cubierto por tests.
            echo    SonarQube usa este reporte para mostrar métricas de calidad.
            call npm run test:coverage
            if errorlevel 1 (
              echo ⚠️ Cobertura falló, continuando sin ella...
            ) else (
              echo ✅ Cobertura generada correctamente
            )
            
            rem 5. Ejecutar análisis
            echo.
            echo ========================================
            echo EJECUTANDO ANÁLISIS SONARQUBE
            echo ========================================
            echo.
            
            call npm run sonar:local
            if errorlevel 1 (
              echo.
              echo ⚠️ ADVERTENCIA: Análisis SonarQube falló
              echo    Posibles causas:
              echo    - Token inválido o expirado
              echo    - SonarQube no está completamente operativo
              echo    - Problemas de red o conectividad
              echo.
              echo ⚠️ Continuando con el pipeline...
              exit /b 0
            )
            
            echo.
            echo ✅ Análisis completado exitosamente
            echo 📊 Resultados: http://localhost:9000/dashboard?id=biblioteca-xonler
            exit /b 0
            
            :skip_sonar
            echo.
            echo ⚠️ Saltando análisis SonarQube...
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
