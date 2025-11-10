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
          if (Test-Path "cloudflared.err") { Remove-Item "cloudflared.err" -Force }

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
          $logFile = Join-Path $env:WORKSPACE "cloudflared.out"
          $logErr = Join-Path $env:WORKSPACE "cloudflared.err"
          
          # Usar Start-Process con redirección explícita
          $process = Start-Process -FilePath $exe -ArgumentList "tunnel", "--url", "http://$($env:HOST):$($env:PORT)" -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $logErr -PassThru
          Write-Host "Cloudflared iniciado con PID: $($process.Id)"
          
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
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'cloudflared.out,cloudflared.err,tunnel_url.txt', onlyIfSuccessful: false
      powershell '''
        Get-Process -Name "node","npm" -ErrorAction SilentlyContinue | ForEach-Object {
          try { Stop-Process -Id $_.Id -Force } catch {}
        }
      '''
    }
  }
}
