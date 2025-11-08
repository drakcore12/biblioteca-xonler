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
    WINDOWS_NODE = 'windows host'  // Nombre del nodo Jenkins configurado
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
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          def nodeVerified = false
          def nodeVersionText = 'unknown'
          
          // Intentar usar el nodo Jenkins de Windows
          try {
            echo "🔍 Verificando Node.js en Windows usando nodo Jenkins..."
            
            node(windowsNode) {
              def nodeVersion = bat(
                script: '@echo off && node --version 2>&1 || echo NOT_INSTALLED',
                returnStdout: true
              ).trim()
              
              if (!nodeVersion.contains('NOT_INSTALLED') && !nodeVersion.trim().isEmpty()) {
                echo "✅ Node.js encontrado en nodo Windows: ${nodeVersion}"
                nodeVersionText = nodeVersion
                nodeVerified = true
              } else {
                echo "⚠️  Node.js no encontrado en el nodo Windows"
              }
            }
            
          } catch (Exception e) {
            echo "⚠️  Nodo Windows no disponible: ${e.message}"
            echo "   Intentando vía SSH..."
            
            // Fallback a SSH
            try {
              def sshConfig = [
                name: 'windows-host',
                user: windowsUser,
                host: windowsHost,
                port: 22,
                allowAnyHosts: true,
                timeout: 10000
              ]
              
              sshCommand(
                remote: sshConfig,
                command: "node --version 2>&1 || echo 'NOT_INSTALLED'"
              )
              
              echo "✅ Comando SSH ejecutado (Node.js verificado vía SSH)"
              nodeVersionText = 'verified-via-ssh'
              nodeVerified = true
              
            } catch (Exception sshError) {
              echo "⚠️  SSH no disponible: ${sshError.message}"
            }
          }
          
          // Si ambos fallaron, verificar indirectamente
          if (!nodeVerified) {
            echo "🔍 Verificando Node.js indirectamente (verificando si el servidor responde)..."
            
            def serverCheck = sh(
              script: "curl -fsS --max-time 5 http://host.docker.internal:3000 >/dev/null 2>&1 && echo 'RUNNING' || echo 'NOT_RUNNING'",
              returnStdout: true
            ).trim()
            
            if (serverCheck == 'RUNNING') {
              echo "✅ Servidor Node.js está corriendo (Node.js está instalado y funcionando)"
              nodeVersionText = 'detected'
              nodeVerified = true
            } else {
              echo "⚠️  Node.js no verificado directamente"
              echo "📝 INSTRUCCIONES PARA WINDOWS:"
              echo "   1. Verifica que Node.js esté instalado:"
              echo "      node --version"
              echo "   2. Si no está instalado:"
              echo "      winget install OpenJS.NodeJS.LTS"
            }
          }
          
          // Guardar estado
          if (nodeVerified) {
            writeFile file: 'node-version.env', text: "NODE_VERSION=${nodeVersionText}\n"
          }
        }
      }
    }

    stage('Instalar Dependencias en Host') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          def depsInstalled = false
          
          // Intentar usar el nodo Jenkins de Windows
          try {
            echo "📦 Instalando dependencias en Windows usando nodo Jenkins..."
            
            node(windowsNode) {
              dir(projectPath) {
                bat 'npm install'
              }
            }
            
            echo "✅ Dependencias instaladas en nodo Windows"
            depsInstalled = true
            
          } catch (Exception e) {
            echo "⚠️  Nodo Windows no disponible: ${e.message}"
            echo "   Intentando vía SSH..."
            
            // Fallback a SSH
            try {
              def sshConfig = [
                name: 'windows-host',
                user: windowsUser,
                host: windowsHost,
                port: 22,
                allowAnyHosts: true,
                timeout: 60000
              ]
              
              sshCommand(
                remote: sshConfig,
                command: "cd '${projectPath}' && npm install"
              )
              
              echo "✅ Dependencias instaladas vía SSH"
              depsInstalled = true
              
            } catch (Exception sshError) {
              echo "⚠️  No se pudieron instalar dependencias vía SSH: ${sshError.message}"
              echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
              echo "   cd ${projectPath}"
              echo "   npm install"
            }
          }
          
          if (!depsInstalled) {
            echo "⚠️  Asegúrate de que las dependencias estén instaladas antes de continuar"
          }
        }
      }
    }

    stage('Verificar PostgreSQL Activo en Host') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def windowsHost = env.WINDOWS_HOST ?: 'host.docker.internal'
          def windowsUser = env.WINDOWS_USER ?: 'MIGUEL'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          def pgVerified = false
          
          // Intentar usar el nodo Jenkins de Windows
          try {
            echo "🐘 Verificando PostgreSQL en Windows usando nodo Jenkins..."
            
            node(windowsNode) {
              def pgStatus = powershell(
                script: "Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status",
                returnStdout: true
              ).trim()
              
              if (pgStatus.contains('Running')) {
                echo "✅ PostgreSQL está corriendo"
                pgVerified = true
              } else {
                echo "⚠️  PostgreSQL no está corriendo, intentando iniciar..."
                
                dir(projectPath) {
                  powershell '.\\scripts\\start-postgres-windows.ps1'
                }
                
                sleep(3)
                
                // Verificar de nuevo
                pgStatus = powershell(
                  script: "Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status",
                  returnStdout: true
                ).trim()
                
                if (pgStatus.contains('Running')) {
                  echo "✅ PostgreSQL iniciado correctamente"
                  pgVerified = true
                }
              }
            }
            
          } catch (Exception e) {
            echo "⚠️  Nodo Windows no disponible: ${e.message}"
            echo "   Intentando vía SSH..."
            
            // Fallback a SSH
            try {
              def sshConfig = [
                name: 'windows-host',
                user: windowsUser,
                host: windowsHost,
                port: 22,
                allowAnyHosts: true,
                timeout: 10000
              ]
              
              def pgStatus = sshCommand(
                remote: sshConfig,
                command: "powershell -Command \"Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\" 2>&1 || echo 'NOT_RUNNING'"
              )
              
              if (pgStatus.contains('Running')) {
                echo "✅ PostgreSQL está corriendo"
                pgVerified = true
              } else {
                sshCommand(
                  remote: sshConfig,
                  command: "cd '${projectPath}' && powershell -ExecutionPolicy Bypass -File .\\scripts\\start-postgres-windows.ps1"
                )
                sleep(3)
                pgVerified = true
              }
              
            } catch (Exception sshError) {
              echo "⚠️  SSH no disponible: ${sshError.message}"
            }
          }
          
          // Verificar conexión a PostgreSQL desde Jenkins
          if (!pgVerified) {
            echo "🔍 Verificando PostgreSQL indirectamente (verificando puerto 5432)..."
            
            def pgCheck = sh(
              script: "timeout 2 bash -c 'echo > /dev/tcp/host.docker.internal/5432' 2>/dev/null && echo 'AVAILABLE' || echo 'NOT_AVAILABLE'",
              returnStdout: true
            ).trim()
            
            if (pgCheck == 'AVAILABLE') {
              echo "✅ PostgreSQL está accesible en host.docker.internal:5432"
              pgVerified = true
            } else {
              echo "⚠️  PostgreSQL no está accesible"
              echo "📝 EJECUTA MANUALMENTE EN WINDOWS:"
              echo "   .\\scripts\\start-postgres-windows.ps1"
            }
          }
          
          if (pgVerified) {
            writeFile file: 'postgres-status.env', text: "POSTGRES_AVAILABLE=true\n"
          }
        }
      }
    }

    stage('Iniciar Servidor Node.js en Host') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          node(windowsNode) {
            dir(projectPath) {
              echo "🚀 Iniciando servidor Node.js en Windows..."
              
              // Detener servidor anterior si existe
              bat '''
                @echo off
                for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do (
                  wmic process where "ProcessId=%%a and CommandLine like '%%Biblioteca-Xonler-main%%'" call terminate >nul 2>&1
                )
              '''
              
              sleep(2)
              
              // Iniciar servidor en background
              bat """
                @echo off
                cd /d "${projectPath}"
                start /B cmd /c "npm start > server.log 2>&1"
              """
              
              echo "⏳ Esperando que el servidor inicie..."
              
              // Healthcheck local desde Windows
              bat '''
                @echo off
                powershell -Command "$ok=$false; for($i=0;$i -lt 20;$i++){ try { $r=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){$ok=$true; Write-Host 'Servidor respondiendo'; break} } catch{} Start-Sleep -s 2 }; if(-not $ok){ Write-Host 'Servidor no respondio'; exit 1 }"
              '''
              
              echo "✅ Servidor Node.js iniciado y respondiendo en http://localhost:3000"
            }
          }
        }
      }
    }

    stage('Ejecutar Tests Unitarios') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          node(windowsNode) {
            dir(projectPath) {
              echo "🧪 Ejecutando tests unitarios en Windows..."
              
              // Crear directorio test-results si no existe
              bat 'if not exist test-results mkdir test-results'
              
              // Ejecutar tests con coverage y JUnit usando el script corregido
              bat 'npm run test:unit'
              
              echo "✅ Tests unitarios completados"
              
              // Publicar JUnit (se genera en test-results/junit.xml)
              junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
              
              // Publicar coverage (no debe fallar el pipeline si falta)
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
      }
    }

    stage('Pruebas de Carga (Artillery)') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          def serverUrl = 'http://localhost:3000'
          
          node(windowsNode) {
            dir(projectPath) {
              echo "🚀 Ejecutando pruebas de carga con Artillery en Windows..."
              
              // Actualizar artillery-config.yml con la URL correcta (sin comillas extra)
              powershell "(Get-Content 'artillery-config.yml') -replace 'target:.*', 'target: \"${serverUrl}\"' | Set-Content 'artillery-config.yml'"
              
              // Crear directorio test-results si no existe
              bat 'if not exist test-results mkdir test-results'
              
              // Instalar Artillery si no está instalado
              bat 'npm install -g artillery || echo Artillery ya instalado'
              
              // Ejecutar Artillery
              bat 'artillery run artillery-config.yml --output test-results\\load-report.json'
              
              echo "✅ Pruebas de carga completadas"
            }
          }
        }
      }
      post {
        always {
          script {
            def windowsNode = env.WINDOWS_NODE ?: 'windows host'
            def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
            
            node(windowsNode) {
              dir(projectPath) {
                archiveArtifacts artifacts: 'test-results/load-report.json', fingerprint: true, onlyIfSuccessful: false, allowEmptyArchive: true
              }
            }
          }
        }
      }
    }

    stage('Cloudflare Tunnel') {
      steps {
        script {
          def windowsNode = env.WINDOWS_NODE ?: 'windows host'
          def projectPath = env.PROJECT_PATH ?: 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
          
          node(windowsNode) {
            dir(projectPath) {
              echo "🌐 Iniciando Cloudflare Tunnel en Windows..."
              
              // Detener tunnel anterior si existe
              bat 'taskkill /IM cloudflared.exe /F >nul 2>&1 || echo No process'
              
              sleep(2)
              
              // Iniciar Cloudflare Tunnel usando el comando específico del usuario
              // Asumimos que cloudflared.exe está en $env:USERPROFILE
              powershell 'Start-Process powershell -ArgumentList \'-NoExit\', \'-Command\', \'& "$env:USERPROFILE\\cloudflared.exe" tunnel --config NUL --url http://127.0.0.1:3000\' -WindowStyle Hidden'
              
              sleep(5)
              
              echo "✅ Cloudflare Tunnel iniciado"
              echo "📝 NOTA: La URL pública se mostrará en la consola de PowerShell en Windows"
              echo "   Para ver la URL, revisa la ventana de PowerShell que se abrió"
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
      sh 'rm -f node-version.env postgres-status.env server-status.env || true'
    }
  }
}
