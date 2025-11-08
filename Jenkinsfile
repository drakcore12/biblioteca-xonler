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

          // Arrancar la app en background de forma completamente independiente (no se cierra al terminar el pipeline)
          powershell '''
            # Crear un proceso completamente desacoplado usando Start-Process
            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = "cmd.exe"
            $psi.Arguments = "/c npm start > server.log 2>&1"
            $psi.WorkingDirectory = "${env:PROJECT_PATH}"
            $psi.UseShellExecute = $true
            $psi.CreateNoWindow = $true
            $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
            
            $process = [System.Diagnostics.Process]::Start($psi)
            # No esperar ni mantener referencia al proceso
            $process = $null
          '''

          echo "⏳ Esperando que el servidor inicie..."
          
          // Health check: esperar hasta que el servidor responda
          bat '''
            @echo off
            setlocal enabledelayedexpansion
            set maxAttempts=30
            set attempt=0
            set serverReady=0
            
            :waitLoop
            if !attempt! geq !maxAttempts! (
              echo ❌ Servidor no respondio despues de !maxAttempts! intentos
              exit /b 1
            )
            
            powershell -Command "try { $r=Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){exit 0}else{exit 1} } catch { exit 1 }"
            
            if !errorlevel! equ 0 (
              echo ✅ Servidor respondiendo en http://127.0.0.1:3000
              set serverReady=1
              goto :end
            )
            
            set /a attempt+=1
            echo    Esperando servidor... (!attempt!/!maxAttempts!)
            timeout /t 2 /nobreak >nul
            goto :waitLoop
            
            :end
            if !serverReady! equ 0 exit /b 1
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
