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
          $app = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru

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

          # 4) Ejecutar cloudflared en PRIMER PLANO y capturar la URL
          Write-Host "Lanzando cloudflared; se quedará en primer plano…"
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'

          (& $exe tunnel --config NUL --url "http://$($env:HOST):$($env:PORT)" 2>&1) `
            | Tee-Object -FilePath "cloudflared.out" `
            | ForEach-Object {
                $_
                if (-not (Test-Path "tunnel_url.txt") -and ($_ -match $regex)) {
                  $url = $Matches[0]
                  "TUNNEL_URL=$url" | Set-Content "tunnel_url.txt"
                  Write-Host "🔗 Túnel: $url"
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
