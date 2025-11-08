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

          // 4) Lanzar ambos (start => procesos quedan fuera del árbol de Jenkins)
          bat 'start "" "%cd%\\start-server.bat"'
          bat 'timeout /t 2 /nobreak >nul'
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
  }
}
