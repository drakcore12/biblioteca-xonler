pipeline {
  agent { label 'windows' }

  stages {
    stage('Run app + tunnel (simple)') {
      steps {
        powershell(returnStatus: true, script: '''
          $ErrorActionPreference = "Stop"
          $env:HOST = "127.0.0.1"
          $env:PORT = "3000"

          # Limpieza previa
          if (Test-Path "tunnel_url.txt") { Remove-Item "tunnel_url.txt" -Force }
          if (Test-Path "cloudflared.out") { Remove-Item "cloudflared.out" -Force }
          if (Test-Path "cloudflared.err") { Remove-Item "cloudflared.err" -Force }

          # 1) Dependencias
          npm ci
          if ($LASTEXITCODE -ne 0) { npm install }

          # 2) Levantar la app (queda viva en otro proceso, completamente desacoplado)
          $appCmd = "start `"`" /B cmd /c `"set HOST=$($env:HOST)&& set PORT=$($env:PORT)&& npm start > server.log 2>&1`""
          cmd /c $appCmd
          Start-Sleep -Seconds 2

          # 3) Esperar a que el puerto esté listo (máx 60s)
          $deadline = (Get-Date).AddSeconds(60)
          $ok = $false
          while ((Get-Date) -lt $deadline) {
            try {
              $ok = Test-NetConnection -ComputerName $env:HOST -Port ([int]$env:PORT) -InformationLevel Quiet
            } catch { $ok = $false }
            if ($ok) { break }
            Start-Sleep -Seconds 1
          }
          if (-not $ok) { 
            Write-Host "⚠️ La app no abrió en http://$env:HOST:$env:PORT en 60 segundos"
            Write-Host "Continuando de todas formas..."
          } else {
            Write-Host "✅ Servidor Node.js está listo en http://$env:HOST:$env:PORT"
            # Esperar un poco más para asegurar que el servidor esté completamente inicializado
            Start-Sleep -Seconds 3
          }

          # 4) Descargar cloudflared si no existe
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          if (-not (Test-Path $exe)) {
            Write-Host "Descargando cloudflared..."
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing
          }

          # 5) Ejecutar cloudflared en background y capturar la URL
          Write-Host "Lanzando cloudflared en background..."
          $logFile = Join-Path $env:WORKSPACE "cloudflared.out"
          $logErr = Join-Path $env:WORKSPACE "cloudflared.err"
          
          # Asegurar que los archivos de log existan (crearlos vacíos si no existen)
          "" | Out-File -FilePath $logFile -Force
          "" | Out-File -FilePath $logErr -Force
          
          # Ejecutar cloudflared completamente desacoplado usando cmd start /B
          # Esto asegura que el proceso esté completamente separado del pipeline
          $cloudflaredCmd = "start `"`" /B `"$exe`" tunnel --url http://$($env:HOST):$($env:PORT) > `"$logFile`" 2> `"$logErr`""
          $null = cmd /c $cloudflaredCmd
          
          # Esperar un momento y obtener el PID de cloudflared
          Start-Sleep -Seconds 2
          $cloudflaredProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Select-Object -First 1
          if ($cloudflaredProcess) {
            Write-Host "Cloudflared iniciado con PID: $($cloudflaredProcess.Id)"
          } else {
            Write-Host "Cloudflared iniciado (PID no disponible aún)"
          }
          
          # Esperar un poco para que cloudflared inicie y empiece a escribir
          Start-Sleep -Seconds 3
          
          # Esperar y capturar la URL (máximo 45 segundos)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $url = $null
          $deadline = (Get-Date).AddSeconds(45)
          
          Write-Host "Esperando a que cloudflared genere la URL..."
          while ((Get-Date) -lt $deadline -and -not $url) {
            Start-Sleep -Seconds 2
            $content = ""
            if (Test-Path $logFile) {
              try {
                $content += Get-Content $logFile -Raw -ErrorAction SilentlyContinue
              } catch {}
            }
            if (Test-Path $logErr) {
              try {
                $content += Get-Content $logErr -Raw -ErrorAction SilentlyContinue
              } catch {}
            }
            
            if ($content -match $regex) {
              $url = $Matches[0]
              $tunnelFile = Join-Path $env:WORKSPACE "tunnel_url.txt"
              "TUNNEL_URL=$url" | Set-Content $tunnelFile
              Write-Host "🔗 Túnel encontrado: $url"
              break
            }
            
            if ($content) {
              $lines = $content -split "`n" | Select-Object -Last 3
              Write-Host "Últimas líneas: $($lines -join ' | ')"
            } else {
              Write-Host "Esperando a que cloudflared escriba en el log..."
            }
          }
          
          if ($url) {
            Write-Host "✅ URL del túnel capturada: $url"
            Write-Host "🌐 Servidor local: http://$($env:HOST):$($env:PORT)"
            Write-Host "🌐 Túnel público: $url"
          } else {
            Write-Host "⚠️ No se pudo capturar la URL en 45 segundos"
            if (Test-Path $logFile) {
              Write-Host "Contenido de stdout:"
              Get-Content $logFile -Tail 20 | Write-Host
            }
            if (Test-Path $logErr) {
              Write-Host "Contenido de stderr:"
              Get-Content $logErr -Tail 20 | Write-Host
            }
          }
          
          Write-Host ""
          Write-Host "=========================================="
          Write-Host "Pipeline completado. Servicios corriendo:"
          Write-Host "- Servidor Node.js: http://$($env:HOST):$($env:PORT)"
          if ($cloudflaredProcess) {
            Write-Host "- Cloudflared PID: $($cloudflaredProcess.Id)"
          }
          if ($url) {
            Write-Host "- Túnel público: $url"
          }
          Write-Host "=========================================="
          Write-Host ""
          
          # Forzar salida del script - esto debe terminar el paso
          Write-Host "Finalizando paso de PowerShell..."
          $global:LASTEXITCODE = 0
          exit 0
        ''')
        script {
          if (fileExists('tunnel_url.txt')) {
            env.TUNNEL_URL = readFile('tunnel_url.txt').trim()
            echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
          }
          env.LOCAL_URL = "http://127.0.0.1:3000"
          echo "🌐 LOCAL_URL = ${env.LOCAL_URL}"
          echo "✅ Paso de PowerShell completado. Pipeline terminando..."
        }
        // Paso adicional para asegurar que el pipeline termine
        bat 'echo Pipeline completado exitosamente && exit /b 0'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'cloudflared.out,cloudflared.err,tunnel_url.txt', onlyIfSuccessful: false
      echo "✅ Pipeline terminado. Servicios siguen corriendo en background."
    }
  }
}
