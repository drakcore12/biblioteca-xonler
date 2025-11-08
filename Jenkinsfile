pipeline {
  agent { label 'windows host' } // tu agente Windows

  environment {
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main'
  }

  stages {
    stage('npm install & start + cloudflared') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Instalar deps (rápido si ya existe lockfile)
          bat 'npm install'

          // Matar cualquier node viejo (opcional)
          bat 'taskkill /F /IM node.exe >nul 2>&1 || echo no-node'
          
          sleep(time: 2, unit: 'SECONDS')

          // Crear script batch temporal para iniciar el servidor de forma independiente
          def scriptPath = "${env.PROJECT_PATH}\\start-server.bat"
          writeFile file: scriptPath, text: """@echo off
cd /d "${env.PROJECT_PATH}"
npm start > server.log 2>&1
"""
          
          // Arrancar la app en background de forma completamente independiente
          bat """
            @echo off
            cd /d "${env.PROJECT_PATH}"
            if exist "${scriptPath}" (
              start "" "${scriptPath}"
            ) else (
              echo Error: No se encontro el script ${scriptPath}
              exit /b 1
            )
          """

          echo "⏳ Esperando que el servidor inicie..."
          
          // Health check: esperar hasta que el servidor responda
          powershell '''
            $maxAttempts = 30
            $attempt = 0
            $serverReady = $false
            
            while ($attempt -lt $maxAttempts -and -not $serverReady) {
              try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                  Write-Host "✅ Servidor respondiendo en http://127.0.0.1:3000"
                  $serverReady = $true
                  break
                }
              } catch {
                $attempt++
                Write-Host "   Esperando servidor... ($attempt/$maxAttempts)"
                Start-Sleep -Seconds 2
              }
            }
            
            if (-not $serverReady) {
              Write-Host "❌ Servidor no respondio despues de $maxAttempts intentos"
              exit 1
            }
          '''

          // Arrancar cloudflared en background
          powershell '''
            Start-Process -WindowStyle Hidden `
              -FilePath "$env:USERPROFILE\\cloudflared.exe" `
              -ArgumentList @("tunnel","--config","NUL","--url","http://127.0.0.1:3000")
          '''
          
          sleep(time: 3, unit: 'SECONDS')
          
          echo "✅ Servidor y Cloudflare Tunnel iniciados"
          echo "📝 Servidor disponible en: http://127.0.0.1:3000"
          echo "🌐 Cloudflare Tunnel iniciado (revisa la consola de PowerShell para ver la URL pública)"
        }
      }
    }
  }
}
