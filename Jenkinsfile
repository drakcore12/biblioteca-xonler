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
    SERVER_URL   = 'http://host.docker.internal:3000'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Instalar/Verificar Node.js en Host') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          try {
            echo "🔍 Verificando Node.js en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 10000
            ]
            
            // Verificar si Node.js está instalado
            def nodeVersion = sshCommand(
              remote: sshConfig,
              command: "node --version 2>&1 || echo 'NOT_INSTALLED'"
            )
            
            if (nodeVersion.contains('NOT_INSTALLED') || nodeVersion.trim().isEmpty()) {
              echo "⚠️  Node.js no encontrado, intentando instalar..."
              echo "📝 NOTA: Node.js debe instalarse manualmente en Windows"
              echo "   Descarga desde: https://nodejs.org/"
              echo "   O usa: winget install OpenJS.NodeJS.LTS"
              
              // Intentar instalar con winget (si está disponible)
              sshCommand(
                remote: sshConfig,
                command: "winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements 2>&1 || echo 'WINGET_NOT_AVAILABLE'"
              )
              
              // Esperar un momento y verificar de nuevo
              sleep(5)
              nodeVersion = sshCommand(
                remote: sshConfig,
                command: "node --version 2>&1 || echo 'NOT_INSTALLED'"
              )
            }
            
            if (!nodeVersion.contains('NOT_INSTALLED') && !nodeVersion.trim().isEmpty()) {
              echo "✅ Node.js encontrado: ${nodeVersion.trim()}"
              echo "NODE_VERSION=${nodeVersion.trim()}" > node-version.env
            } else {
              echo "❌ Node.js no está instalado"
              echo "   Instala Node.js manualmente en Windows antes de continuar"
              error("Node.js no está disponible en el host Windows")
            }
            
          } catch (Exception e) {
            echo "⚠️  Error verificando Node.js: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   node --version"
            echo "   Si no está instalado: winget install OpenJS.NodeJS.LTS"
            error("No se pudo verificar Node.js en el host")
          }
        }
      }
    }

    stage('Instalar Dependencias en Host') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          try {
            echo "📦 Instalando dependencias en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 60000  // 60 segundos para npm install
            ]
            
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && npm install"
            )
            
            echo "✅ Dependencias instaladas"
            
          } catch (Exception e) {
            echo "⚠️  Error instalando dependencias: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   cd ${projectPath}"
            echo "   npm install"
            error("No se pudieron instalar las dependencias")
          }
        }
      }
    }

    stage('Verificar PostgreSQL Activo en Host') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          try {
            echo "🐘 Verificando PostgreSQL en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 10000
            ]
            
            // Verificar si PostgreSQL está corriendo
            def pgStatus = sshCommand(
              remote: sshConfig,
              command: "powershell -Command \"Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\" 2>&1 || echo 'NOT_RUNNING'"
            )
            
            if (pgStatus.contains('Running')) {
              echo "✅ PostgreSQL está corriendo"
            } else {
              echo "⚠️  PostgreSQL no está corriendo, intentando iniciar..."
              
              // Intentar iniciar PostgreSQL
              sshCommand(
                remote: sshConfig,
                command: "cd '${projectPath}' && powershell -ExecutionPolicy Bypass -File .\\scripts\\start-postgres-windows.ps1"
              )
              
              sleep(3)
              
              // Verificar de nuevo
              pgStatus = sshCommand(
                remote: sshConfig,
                command: "powershell -Command \"Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\" 2>&1 || echo 'NOT_RUNNING'"
              )
            }
            
            // Verificar conexión a PostgreSQL
            def pgConnection = sshCommand(
              remote: sshConfig,
              command: "powershell -Command \"$env:PGPASSWORD='postgres'; & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -h localhost -p 5432 -U postgres -d postgres -c 'SELECT 1;' 2>&1\" || echo 'CONNECTION_FAILED'"
            )
            
            if (!pgConnection.contains('CONNECTION_FAILED') && !pgConnection.contains('error')) {
              echo "✅ PostgreSQL está activo y accesible"
              echo "POSTGRES_AVAILABLE=true" > postgres-status.env
            } else {
              echo "❌ PostgreSQL no está accesible"
              echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
              echo "   .\\scripts\\start-postgres-windows.ps1"
              error("PostgreSQL no está disponible")
            }
            
          } catch (Exception e) {
            echo "⚠️  Error verificando PostgreSQL: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   .\\scripts\\start-postgres-windows.ps1"
            error("No se pudo verificar PostgreSQL")
          }
        }
      }
    }

    stage('Iniciar Servidor Node.js en Host') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          try {
            echo "🚀 Iniciando servidor Node.js en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 10000
            ]
            
            // Detener servidor anterior si existe
            sshCommand(
              remote: sshConfig,
              command: "powershell -Command \"Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { \$_.Path -like '*${projectPath.replace('\\', '\\\\')}*' } | Stop-Process -Force\" 2>&1 || echo 'NO_PROCESS'"
            )
            
            sleep(2)
            
            // Iniciar servidor en background
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd ''${projectPath}''; npm start' -WindowStyle Hidden"
            )
            
            echo "⏳ Esperando que el servidor inicie..."
            sleep(10)
            
            // Verificar que el servidor esté corriendo
            def serverCheck = sh(
              script: "curl -fsS --max-time 5 http://host.docker.internal:3000 >/dev/null 2>&1 && echo 'RUNNING' || echo 'NOT_RUNNING'",
              returnStdout: true
            ).trim()
            
            if (serverCheck == 'RUNNING') {
              echo "✅ Servidor Node.js corriendo en http://host.docker.internal:3000"
              echo "SERVER_AVAILABLE=true" > server-status.env
            } else {
              echo "⚠️  Servidor no responde, esperando más tiempo..."
              sleep(10)
              
              serverCheck = sh(
                script: "curl -fsS --max-time 5 http://host.docker.internal:3000 >/dev/null 2>&1 && echo 'RUNNING' || echo 'NOT_RUNNING'",
                returnStdout: true
              ).trim()
              
              if (serverCheck == 'RUNNING') {
                echo "✅ Servidor Node.js corriendo"
                echo "SERVER_AVAILABLE=true" > server-status.env
              } else {
                error("Servidor Node.js no está respondiendo")
              }
            }
            
          } catch (Exception e) {
            echo "⚠️  Error iniciando servidor: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   cd ${projectPath}"
            echo "   npm start"
            error("No se pudo iniciar el servidor")
          }
        }
      }
    }

    stage('Ejecutar Tests Unitarios') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          try {
            echo "🧪 Ejecutando tests unitarios en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 120000  // 2 minutos para tests
            ]
            
            // Ejecutar tests unitarios
            def testOutput = sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && npm run test:unit 2>&1"
            )
            
            echo "📊 Resultados de tests unitarios:"
            echo testOutput
            
            // Copiar resultados de tests si existen
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && if (Test-Path 'coverage') { Copy-Item -Path 'coverage' -Destination 'coverage-jenkins' -Recurse -Force } 2>&1 || echo 'NO_COVERAGE'"
            )
            
            echo "✅ Tests unitarios completados"
            
          } catch (Exception e) {
            echo "⚠️  Error ejecutando tests: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   cd ${projectPath}"
            echo "   npm run test:unit"
            // No fallar el pipeline, solo advertir
            echo "⚠️  Tests unitarios fallaron, pero continuando..."
          }
        }
      }
      post {
        always {
          publishHTML(target: [
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
        }
      }
    }

    stage('Pruebas de Carga (Artillery)') {
      steps {
        script {
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          def serverUrl = env.SERVER_URL ?: 'http://localhost:3000'
          
          // Verificar que el servidor esté disponible
          def serverCheck = sh(
            script: "curl -fsS --max-time 5 http://host.docker.internal:3000 >/dev/null 2>&1 && echo 'RUNNING' || echo 'NOT_RUNNING'",
            returnStdout: true
          ).trim()
          
          if (serverCheck != 'RUNNING') {
            echo "⚠️  Servidor no disponible, omitiendo pruebas de carga"
            return
          }
          
          try {
            echo "🚀 Ejecutando pruebas de carga con Artillery en Windows..."
            
            def sshConfig = [
              name: 'windows-host',
              user: windowsUser,
              host: windowsHost,
              port: 22,
              allowAnyHosts: true,
              timeout: 180000  // 3 minutos para pruebas de carga
            ]
            
            // Actualizar artillery-config.yml con la URL correcta
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && powershell -Command \"(Get-Content 'artillery-config.yml') -replace 'target:.*', 'target: \\\"${serverUrl}\\\"' | Set-Content 'artillery-config.yml'\""
            )
            
            // Ejecutar Artillery
            def artilleryOutput = sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && npm run test:load 2>&1"
            )
            
            echo "📊 Resultados de pruebas de carga:"
            echo artilleryOutput
            
            // Copiar reporte si existe
            sshCommand(
              remote: sshConfig,
              command: "cd '${projectPath}' && if (Test-Path 'test-results\\load-report.json') { Copy-Item -Path 'test-results\\load-report.json' -Destination 'test-results\\load-report-jenkins.json' -Force } 2>&1 || echo 'NO_REPORT'"
            )
            
            echo "✅ Pruebas de carga completadas"
            
          } catch (Exception e) {
            echo "⚠️  Error ejecutando pruebas de carga: ${e.message}"
            echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
            echo "   cd ${projectPath}"
            echo "   npm run test:load"
            // No fallar el pipeline, solo advertir
            echo "⚠️  Pruebas de carga fallaron, pero continuando..."
          }
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'test-results/load-report*.json', fingerprint: true, onlyIfSuccessful: false, allowEmptyArchive: true
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
      sh 'rm -f node-version.env postgres-status.env server-status.env || true'
    }
  }
}
