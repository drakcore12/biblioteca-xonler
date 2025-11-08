pipeline {
  agent { label 'windows host' } // tu agente Windows

  environment {
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main'
  }

  stages {
    stage('npm install & start + cloudflared') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Instalar deps
          bat 'npm install'

          // Matar node viejo (opcional)
          bat 'taskkill /F /IM node.exe >nul 2>&1 || echo no-node'
          bat 'taskkill /F /IM cloudflared.exe >nul 2>&1 || echo no-cloudflared'

          // Crear start-server.bat (seteando BUILD_ID para evitar el ProcessTreeKiller)
          script {
            def serverBat = """@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "${env.PROJECT_PATH}"
rem start detached: npm start -> server.log
start "" cmd /c "npm start > server.log 2>&1"
"""
            writeFile file: 'start-server.bat', text: serverBat
            echo "✅ Script start-server.bat creado"
          }

          // Crear start-tunnel.bat
          script {
            def tunnelBat = """@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "${env.PROJECT_PATH}"
start "" "%USERPROFILE%\\cloudflared.exe" tunnel --config NUL --url http://127.0.0.1:3000 > cloudflared.log 2>&1
"""
            writeFile file: 'start-tunnel.bat', text: tunnelBat
            echo "✅ Script start-tunnel.bat creado"
          }

          // Verificar que los scripts existen antes de ejecutarlos
          bat """
            @echo off
            cd /d "${env.PROJECT_PATH}"
            if not exist "start-server.bat" (
              echo Error: start-server.bat no existe
              exit /b 1
            )
            if not exist "start-tunnel.bat" (
              echo Error: start-tunnel.bat no existe
              exit /b 1
            )
            echo Scripts encontrados, iniciando...
          """

          // Lanzar los scripts (start los deja fuera del job)
          bat """
            @echo off
            cd /d "${env.PROJECT_PATH}"
            start "" "start-server.bat"
            timeout /t 2 /nobreak >nul
            start "" "start-tunnel.bat"
            echo Scripts lanzados
          """

          // Healthcheck para confirmar servidor
          powershell '''
            $ok=$false
            for($i=0;$i -lt 20 -and -not $ok;$i++){
              try{ 
                $r=Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing -TimeoutSec 3
                if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){
                  $ok=$true
                  Write-Host "✅ Servidor respondiendo en http://127.0.0.1:3000"
                  break
                }
              } catch {
                Write-Host "   Esperando servidor... ($($i+1)/20)"
              }
              Start-Sleep -Seconds 2
            }
            if(-not $ok){ 
              Write-Error "❌ Servidor no respondió en http://127.0.0.1:3000"
              exit 1
            }
          '''

          echo '✅ Scripts arrancados; deberían quedarse corriendo aún cuando termine el job.'
          echo '📝 Logs: server.log y cloudflared.log en el directorio del proyecto.'
          echo '🌐 Servidor disponible en: http://127.0.0.1:3000'
        }
      }
    }
  }
}
