pipeline {
  agent { label 'windows' }

  stages {
    stage('Run app + tunnel (simple)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          $env:HOST = "127.0.0.1"
          $env:PORT = "3000"

          # Limpieza previa
          if (Test-Path "tunnel_url.txt") { Remove-Item "tunnel_url.txt" -Force }
          if (Test-Path "cloudflared.out") { Remove-Item "cloudflared.out" -Force }

          # 1) Dependencias
          npm ci
          if ($LASTEXITCODE -ne 0) { npm install }

          # 2) Levantar la app (queda viva en otro proceso)
          $app = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -NoNewWindow -PassThru

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
          if (-not $ok) { throw "La app no abrió en http://$env:HOST:$env:PORT" }

          # 4) Descargar cloudflared si no existe
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          if (-not (Test-Path $exe)) {
            Write-Host "Descargando cloudflared..."
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing
          }

          # 5) Ejecutar cloudflared en background y capturar la URL
          Write-Host "Lanzando cloudflared en background..."
          $logFile = "cloudflared.out"
          $cmd = "start \"\" /B cmd /c `"$exe`" tunnel --url http://$($env:HOST):$($env:PORT) > `"$logFile`" 2>&1"
          cmd /c $cmd
          
          # Esperar un poco para que cloudflared inicie y empiece a escribir
          Start-Sleep -Seconds 3
          
          # Esperar y capturar la URL (máximo 45 segundos)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $url = $null
          $deadline = (Get-Date).AddSeconds(45)
          $lastSize = 0
          
          Write-Host "Esperando a que cloudflared genere la URL..."
          while ((Get-Date) -lt $deadline -and -not $url) {
            Start-Sleep -Seconds 2
            if (Test-Path $logFile) {
              try {
                $currentSize = (Get-Item $logFile).Length
                if ($currentSize -gt $lastSize -or $lastSize -eq 0) {
                  $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
                  if ($content -match $regex) {
                    $url = $Matches[0]
                    "TUNNEL_URL=$url" | Set-Content "tunnel_url.txt"
                    Write-Host "🔗 Túnel encontrado: $url"
                    break
                  }
                  $lastSize = $currentSize
                  # Mostrar últimas líneas para debug
                  $lines = Get-Content $logFile -Tail 3 -ErrorAction SilentlyContinue
                  if ($lines) {
                    Write-Host "Últimas líneas del log: $($lines -join ' | ')"
                  }
                }
              } catch {
                Write-Host "Error leyendo log: $_"
              }
            } else {
              Write-Host "Esperando a que se cree el archivo de log..."
            }
          }
          
          if ($url) {
            Write-Host "✅ URL del túnel capturada: $url"
          } else {
            Write-Host "⚠️ No se pudo capturar la URL en 45 segundos"
            if (Test-Path $logFile) {
              Write-Host "Contenido del log:"
              Get-Content $logFile -Tail 20 | Write-Host
            }
          }
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'cloudflared.out,tunnel_url.txt', onlyIfSuccessful: false
      powershell '''
        Get-Process -Name "node","npm" -ErrorAction SilentlyContinue | ForEach-Object {
          try { Stop-Process -Id $_.Id -Force } catch {}
        }
      '''
    }
  }
}
