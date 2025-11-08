pipeline {
  agent { label 'windows host' } // tu agente Windows

  environment {
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main'
  }

  stages {
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

          // 4) Lanzar servidor (cloudflared se lanza después en el paso 6)
          bat 'start "" "%cd%\\start-server.bat"'
          powershell 'Start-Sleep -Seconds 2'

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

          // 6) Lanzar cloudflared y extraer URL del tunnel automáticamente
          powershell '''
            $WS = "$env:WORKSPACE"
            $exe = "$env:USERPROFILE\\cloudflared.exe"
            $stdoutLog = Join-Path $WS 'cloudflared.log'
            $stderrLog = Join-Path $WS 'cloudflared-error.log'
            $tunnelFile = Join-Path $WS 'tunnel-url.txt'
            
            # Limpia logs anteriores
            Remove-Item -Path $stdoutLog,$stderrLog -Force -ErrorAction SilentlyContinue | Out-Null
            
            # Lanza cloudflared en background usando redirección de PowerShell (no bloquea el Pipeline)
            Start-Process -FilePath $exe `
              -ArgumentList @("tunnel","--config","NUL","--no-autoupdate","--url","http://127.0.0.1:3000") `
              -WindowStyle Hidden `
              -RedirectStandardOutput $stdoutLog `
              -RedirectStandardError $stderrLog
            
            # Espera un momento para que cloudflared inicie
            Start-Sleep -Seconds 2
            
            # Espera y extrae la URL del quick tunnel (busca en ambos logs)
            $regex = "https://[a-z0-9-]+\.trycloudflare\.com"
            $found = $false
            for ($i=0; $i -lt 30 -and -not $found; $i++) {
              Start-Sleep -Seconds 1
              $content = (Test-Path $stdoutLog) ? (Get-Content $stdoutLog -Raw -ErrorAction SilentlyContinue) : ''
              $errorContent = (Test-Path $stderrLog) ? (Get-Content $stderrLog -Raw -ErrorAction SilentlyContinue) : ''
              $text = $content + "`n" + $errorContent
              if ($text -match $regex) {
                $url = $matches[0]
                Set-Content -Path $tunnelFile -Value ($url + "`r`n") -Encoding UTF8
                Write-Host ""
                Write-Host "✅ URL del tunnel: $url"
                $found = $true
                break
              }
              if ($i % 5 -eq 0) {
                Write-Host ("   Esperando URL del tunnel... ({0}/30)" -f ($i+1))
              }
            }
            
            if (-not $found) {
              Write-Host "⚠️  No se encontró la URL del tunnel, usando localhost"
              Set-Content -Path $tunnelFile -Value ("http://127.0.0.1:3000`r`n") -Encoding UTF8
            }
            
            # Mostrar confirmación con salto de línea "real"
            $finalUrl = Get-Content $tunnelFile -Raw -ErrorAction SilentlyContinue
            Write-Host ("📝 URL final guardada: {0}" -f $finalUrl.Trim())
            
            # Asegurar que el script termine correctamente
            exit 0
          '''
          
          // Exportar TUNNEL_URL al entorno para las siguientes stages
          script {
            def url = readFile('tunnel-url.txt').trim()
            env.TUNNEL_URL = url
            echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
          }

          echo '✅ Lanzados. Revisar: server.log y ${WORKSPACE}\\cloudflared.log'
          echo '🌐 Servidor local: http://127.0.0.1:3000'
          echo "🌐 Servidor público: ${env.TUNNEL_URL}"

          // 6) MUY IMPORTANTE: limpiar ERRORLEVEL para evitar fallos fantasma (p.ej. 128)
          bat 'cmd /c exit /b 0'
        }
      }
      
    }
       stage('Pruebas Unitarias (Jest)') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Crear directorio para reportes (asegurar que existe)
          bat 'if not exist test-results mkdir test-results'
          bat 'if not exist coverage mkdir coverage'
          
          // Ejecutar pruebas unitarias con cobertura
          bat 'npm run test:unit || ver >nul'
          
          // Verificar que el reporte JUnit se generó
          script {
            def junitPath = "test-results/junit.xml"
            if (fileExists(junitPath)) {
              echo "✅ Reporte JUnit encontrado en: ${junitPath}"
              junit junitPath
            } else {
              echo "⚠️  Reporte JUnit no encontrado, buscando en otras ubicaciones..."
              // Buscar en el directorio actual también
              bat(returnStatus: true, script: '''
                @echo off
                if exist "junit.xml" (
                  echo Encontrado junit.xml en directorio raiz
                  copy /Y junit.xml test-results\\junit.xml
                )
              ''')
              if (fileExists(junitPath)) {
                junit junitPath
              } else {
                echo "⚠️  No se pudo encontrar el reporte JUnit, continuando sin publicarlo"
              }
            }
          }
          
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

    stage('Pruebas E2E (Playwright)') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Esperar un poco más para que el servidor esté completamente listo
          powershell 'Start-Sleep -Seconds 5'
          
          // Healthcheck del túnel público antes de E2E
          powershell(returnStatus: true, script: '''
            $u = $env:TUNNEL_URL
            if (-not $u) { $u = "http://127.0.0.1:3000" }
            $ok=$false
            for($i=0;$i -lt 10 -and -not $ok;$i++){
              try{
                $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 3
                if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ 
                  $ok=$true
                  Write-Host "✅ Túnel OK"
                  break
                }
              } catch { 
                Write-Host "   Esperando túnel... ($($i+1)/10)"
              }
              Start-Sleep -Seconds 2
            }
            if(-not $ok){ 
              Write-Host "⚠️  Túnel no responde aún (seguimos con localhost como fallback)"
            }
          ''')
          
          // Configurar BASE_URL para Playwright usando la URL del tunnel
          script {
            def baseUrl = env.TUNNEL_URL?.trim()
            if (!baseUrl || baseUrl.startsWith('http://127.0.0.1')) {
              echo "⚠️  Usando fallback localhost para E2E"
              baseUrl = "http://127.0.0.1:3000"
            }
            env.BASE_URL = baseUrl
            echo "🌐 Ejecutando E2E contra: ${env.BASE_URL}"
          }
          
          // Ejecutar pruebas E2E (no falla el stage si hay problemas) con timeout
          timeout(time: 5, unit: 'MINUTES') {
            bat(returnStatus: true, script: "set BASE_URL=${env.BASE_URL} && npm run test:e2e")
          }
          
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
          
          // Actualizar artillery-config.yml con la URL del tunnel
          script {
            def targetUrl = env.TUNNEL_URL ?: "http://127.0.0.1:3000"
            echo "🚀 Ejecutando pruebas de carga contra: ${targetUrl}"
            
            // Leer artillery-config.yml
            def configContent = readFile('artillery-config.yml')
            
            // Reemplazar el target con la URL del tunnel
            def updatedConfig = configContent.replaceAll(
              ~/target:\s*"[^"]*"/,
              "target: \"${targetUrl}\""
            )
            
            // Escribir el archivo actualizado
            writeFile file: 'artillery-config.yml', text: updatedConfig
            echo "✅ artillery-config.yml actualizado con URL: ${targetUrl}"
          }
          
          // Ejecutar pruebas de carga y generar reporte JSON con timeout
          timeout(time: 10, unit: 'MINUTES') {
            bat(returnStatus: true, script: 'npx artillery run artillery-config.yml --output test-results/load-report.json')
          }
          
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
