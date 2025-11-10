pipeline {
  agent { label 'windows host' }
  tools { git 'Default' }              // Asegúrate de tener esta instalación en Manage Jenkins → Tools
  options {
    skipDefaultCheckout(true)         // Deshabilitar checkout automático, usaremos nuestro propio stage
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        bat '''
          git clone https://github.com/drakcore12/biblioteca-xonler.git .
          git checkout main
        '''
        echo "✅ Checkout completado exitosamente"
      }
    }

    stage('Install & Start') {
      steps {
        bat 'npm ci || npm install'
        // Arranca el server en 127.0.0.1:3000 y deja logs en server.log
        bat 'start "" cmd /c "set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"'
        // Esperar y verificar que el servidor esté listo
        powershell '''
          $maxAttempts = 30
          $attempt = 0
          $serverReady = $false
          
          Write-Host "Esperando a que el servidor esté listo en http://127.0.0.1:3000..."
          
          while ($attempt -lt $maxAttempts -and -not $serverReady) {
            Start-Sleep -Seconds 2
            $attempt++
            
            try {
              $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
              if ($response.StatusCode -eq 200) {
                $serverReady = $true
                Write-Host "✅ Servidor listo después de $attempt intentos"
              }
            } catch {
              Write-Host "Intento $attempt/$maxAttempts: Servidor aún no responde..."
              if (Test-Path "server.log") {
                $lastLines = Get-Content "server.log" -Tail 3 -ErrorAction SilentlyContinue
                if ($lastLines) {
                  Write-Host "Últimas líneas del log: $($lastLines -join ' | ')"
                }
              }
            }
          }
          
          if (-not $serverReady) {
            Write-Host "❌ El servidor no respondió después de $maxAttempts intentos"
            if (Test-Path "server.log") {
              Write-Host "=== Contenido completo de server.log ==="
              Get-Content "server.log" | Write-Host
            }
            exit 1
          }
        '''
      }
    }

    stage('Tunnel (cloudflared)') {
      steps {
        // Descarga cloudflared si no existe, lo lanza y captura la URL del túnel
        powershell '''
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          if (-not (Test-Path $exe)) {
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing
          }

          $log = Join-Path $env:WORKSPACE "cloudflared.log"
          cmd /c "start \"\" /B `"$exe`" tunnel --config NUL --no-autoupdate --url http://127.0.0.1:3000 > `"$log`" 2>&1"

          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          for ($i=0; $i -lt 30; $i++) {
            Start-Sleep 1
            if (Test-Path $log) {
              $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
              if ($txt -match $regex) {
                $u = $matches[0]
                Set-Content -Path (Join-Path $env:WORKSPACE 'tunnel-url.txt') -Value ($u + "`r`n")
                Write-Host "TUNNEL_URL=$u"
                break
              }
            }
          }
        '''
        script {
          env.TUNNEL_URL = fileExists('tunnel-url.txt') ? readFile('tunnel-url.txt').trim() : 'http://127.0.0.1:3000'
          echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
        }
      }
    }
  }
}

