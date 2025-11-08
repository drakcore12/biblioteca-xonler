pipeline {
  agent { label 'windows host' } // tu agente Windows

  environment {
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main'
  }

  stages {
    stage('Pruebas Unitarias (Jest)') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Crear directorio para reportes
          bat 'if not exist test-results mkdir test-results'
          
          // Ejecutar pruebas unitarias con cobertura
          bat 'npm run test:unit || ver >nul'
          
          // Publicar reportes JUnit
          junit 'test-results/junit.xml'
          
          // Publicar reporte de cobertura HTML
          publishHTML([
            reportDir: 'coverage/lcov-report',
            reportFiles: 'index.html',
            reportName: 'Cobertura de Código (Jest)',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          
          echo '✅ Pruebas unitarias completadas'
        }
      }
    }
    
    stage('npm install & start + cloudflared') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // 1) Instalar deps (rápido si ya existe lockfile)
          bat 'npm install || ver >nul'

          // 2) Matar procesos previos SIN fallar el stage
          bat(returnStatus: true, script: 'taskkill /F /IM cloudflared.exe >nul 2>&1')
          bat(returnStatus: true, script: 'taskkill /F /IM node.exe >nul 2>&1')
          echo 'Procesos anteriores detenidos (si había)'

          // 3) Crear/actualizar scripts de arranque desacoplados
          script {
            writeFile file: "${env.PROJECT_PATH}\\start-server.bat", text: """@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "${env.PROJECT_PATH}"
start "" cmd /c "set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"
"""
            writeFile file: "${env.PROJECT_PATH}\\start-tunnel.bat", text: """@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "%USERPROFILE%"
start "" "%USERPROFILE%\\cloudflared.exe" tunnel --config NUL --url http://127.0.0.1:3000 > "%USERPROFILE%\\cloudflared.log" 2>&1
"""
            echo "✅ Scripts batch creados"
          }

          // 4) Lanzar ambos (start => procesos quedan fuera del árbol de Jenkins)
          bat 'start "" "%cd%\\start-server.bat"'
          powershell 'Start-Sleep -Seconds 2'
          bat(returnStatus: true, script: 'start "" "%cd%\\start-tunnel.bat"')

          // 5) Healthcheck rápido (no falla el stage)
          powershell(returnStatus: true, script: '''
            $ok=$false
            for($i=0;$i -lt 20 -and -not $ok;$i++){
              try{ 
                $r=Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing -TimeoutSec 3
                if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){
                  $ok=$true
                  Write-Host "✅ Servidor OK"
                  break
                }
              } catch {
                Write-Host "   Esperando servidor... ($($i+1)/20)"
              }
              Start-Sleep -Seconds 2
            }
            if(-not $ok){ 
              Write-Host "⚠️  No respondió aún, revisa server.log"
            }
          ''')

          echo '✅ Lanzados. Revisar: server.log y %USERPROFILE%\\cloudflared.log'
          echo '🌐 Servidor disponible en: http://127.0.0.1:3000'

          // 6) MUY IMPORTANTE: limpiar ERRORLEVEL para evitar fallos fantasma (p.ej. 128)
          bat 'cmd /c exit /b 0'
        }
      }
    }
    
    stage('Pruebas E2E (Playwright)') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Esperar un poco más para que el servidor esté completamente listo
          powershell 'Start-Sleep -Seconds 5'
          
          // Ejecutar pruebas E2E (no falla el stage si hay problemas)
          bat(returnStatus: true, script: 'npm run test:e2e')
          
          // Publicar reporte HTML de Playwright
          publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Reporte E2E (Playwright)',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          
          echo '✅ Pruebas E2E completadas (revisa reportes si hay fallos)'
        }
      }
    }
    
    stage('Pruebas de Carga (Artillery)') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Verificar que Artillery esté instalado globalmente o localmente
          bat(returnStatus: true, script: 'where artillery >nul 2>&1 || npx artillery --version >nul 2>&1')
          
          // Ejecutar pruebas de carga y generar reporte JSON
          bat(returnStatus: true, script: 'npx artillery run artillery-config.yml --output test-results/load-report.json')
          
          // Generar reporte HTML si existe el JSON
          bat(returnStatus: true, script: '''
            @echo off
            if exist "test-results\\load-report.json" (
              npx artillery report test-results/load-report.json --output test-results/load-report.html
              echo Reporte HTML generado
            ) else (
              echo No se generó reporte JSON, saltando generación de HTML
            )
          ''')
          
          // Publicar reporte HTML de Artillery
          publishHTML([
            reportDir: 'test-results',
            reportFiles: 'load-report.html',
            reportName: 'Reporte de Carga (Artillery)',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          
          // Archivar reportes JSON
          archiveArtifacts artifacts: 'test-results/load-report.json', allowEmptyArchive: true
          
          echo '✅ Pruebas de carga completadas'
        }
      }
    }
  }
}
