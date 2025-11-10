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
        // Iniciar servidor usando PowerShell con mejor control
        powershell '''
          $env:HOST = "127.0.0.1"
          $env:PORT = "3000"
          
          Write-Host "Iniciando servidor en http://$env:HOST:$env:PORT..."
          
          $logFile = Join-Path $env:WORKSPACE "server.log"
          
          # Iniciar el servidor en background usando Start-Process
          $process = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile -WorkingDirectory $env:WORKSPACE
          
          Write-Host "Proceso npm iniciado con PID: $($process.Id)"
          
          # Esperar y verificar que el proceso esté corriendo y el puerto esté escuchando
          $maxAttempts = 30
          $attempt = 0
          $serverReady = $false
          
          while ($attempt -lt $maxAttempts -and -not $serverReady) {
            Start-Sleep -Seconds 2
            $attempt++
            
            # Verificar que el proceso aún esté corriendo
            try {
              $proc = Get-Process -Id $process.Id -ErrorAction Stop
              Write-Host "Intento $attempt/$maxAttempts: Proceso Node corriendo (PID: $($proc.Id))"
            } catch {
              Write-Host "❌ El proceso npm se detuvo inesperadamente"
              if (Test-Path $logFile) {
                Write-Host "=== Log del servidor ==="
                Get-Content $logFile | Write-Host
              }
              exit 1
            }
            
            # Verificar que el puerto 3000 esté escuchando
            $portListening = $false
            try {
              $connections = netstat -an | Select-String "127.0.0.1:3000.*LISTENING"
              if ($connections) {
                $portListening = $true
                Write-Host "✅ Puerto 3000 está escuchando"
              }
            } catch {
              Write-Host "No se pudo verificar el puerto con netstat"
            }
            
            # Si el puerto está escuchando, intentar conexión HTTP
            if ($portListening) {
              try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                $serverReady = $true
                Write-Host "✅ Servidor listo y respondiendo después de $attempt intentos"
              } catch {
                Write-Host "Puerto escuchando pero HTTP aún no responde..."
                if (Test-Path $logFile) {
                  $lastLines = Get-Content $logFile -Tail 5 -ErrorAction SilentlyContinue
                  if ($lastLines) {
                    Write-Host "Últimas líneas: $($lastLines -join ' | ')"
                  }
                }
              }
            } else {
              Write-Host "Puerto 3000 aún no está escuchando..."
              if (Test-Path $logFile) {
                $lastLines = Get-Content $logFile -Tail 3 -ErrorAction SilentlyContinue
                if ($lastLines) {
                  Write-Host "Log: $($lastLines -join ' | ')"
                }
              }
            }
          }
          
          if (-not $serverReady) {
            Write-Host "❌ El servidor no está listo después de $maxAttempts intentos"
            if (Test-Path $logFile) {
              Write-Host "=== Contenido completo del log ==="
              Get-Content $logFile | Write-Host
            }
            exit 1
          }
          
          Write-Host "✅ Servidor iniciado correctamente y listo para recibir conexiones"
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

