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
          if (Test-Path "server.log") { Remove-Item "server.log" -Force }

          # 1) Dependencias
          npm ci
          if ($LASTEXITCODE -ne 0) { npm install }

          # 2) Levantar la app (queda viva en otro proceso, completamente desacoplado)
          $appCmd = 'start "" /B cmd /c "set HOST=' + $env:HOST + '&& set PORT=' + $env:PORT + '&& npm start > server.log 2>&1"'
          cmd /c $appCmd
          Start-Sleep -Seconds 2

          # 3) Esperar a que el servidor esté completamente listo (máx 90s)
          Write-Host "Esperando a que el servidor Node.js esté completamente listo..."
          $deadline = (Get-Date).AddSeconds(90)
          $serverReady = $false
          $attempts = 0
          
          while ((Get-Date) -lt $deadline -and -not $serverReady) {
            $attempts++
            $portOpen = $false
            try {
              $portOpen = Test-NetConnection -ComputerName $env:HOST -Port ([int]$env:PORT) -InformationLevel Quiet -WarningAction SilentlyContinue
            } catch { $portOpen = $false }
            
            if ($portOpen) {
              try {
                $response = Invoke-WebRequest -Uri "http://$($env:HOST):$($env:PORT)" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                  $serverReady = $true
                  Write-Host "✅ Servidor Node.js está completamente listo y respondiendo (intento $attempts)"
                  break
                }
              } catch {
                if ($attempts % 5 -eq 0) {
                  Write-Host "Puerto abierto pero servidor aún no responde HTTP (intento $attempts)..."
                }
              }
            } else {
              if ($attempts % 5 -eq 0) {
                Write-Host "Esperando a que el puerto $($env:PORT) se abra (intento $attempts)..."
              }
            }
            
            Start-Sleep -Seconds 2
          }
          
          if (-not $serverReady) { 
            Write-Host "⚠️ El servidor no está completamente listo después de 90 segundos"
            Write-Host "Continuando de todas formas, pero el túnel puede no funcionar..."
          } else {
            Write-Host "✅ Servidor Node.js verificado y funcionando en http://$($env:HOST):$($env:PORT)"
            Start-Sleep -Seconds 5
          }

          # 4) Verificación final del servidor antes de iniciar cloudflared
          if ($serverReady) {
            try {
              $finalCheck = Invoke-WebRequest -Uri "http://$($env:HOST):$($env:PORT)" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
              Write-Host "✅ Servidor verificado: HTTP $($finalCheck.StatusCode) - Listo para cloudflared"
            } catch {
              Write-Host "⚠️ Advertencia: El servidor no responde en la verificación final: $($_.Exception.Message)"
              Write-Host "Iniciando cloudflared de todas formas..."
            }
          }

          # 5) Descargar cloudflared si no existe
          $exe = Join-Path $env:USERPROFILE "cloudflared.exe"
          if (-not (Test-Path $exe)) {
            Write-Host "Descargando cloudflared..."
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing
          }

          # 6) Ejecutar cloudflared en background y capturar la URL
          Write-Host "Lanzando cloudflared en background..."
          $logFile = Join-Path $env:WORKSPACE "cloudflared.out"
          $logErr  = Join-Path $env:WORKSPACE "cloudflared.err"
          
          # Crear/limpiar logs
          "" | Out-File -FilePath $logFile -Force
          "" | Out-File -FilePath $logErr -Force
          
          # Crear batch que lance cloudflared detached (start /B)
          $batchFile = Join-Path $env:WORKSPACE "run-cloudflared.bat"
          @"
@echo off
start "" /B "$exe" tunnel --url http://$($env:HOST):$($env:PORT) > "$logFile" 2> "$logErr"
"@ | Out-File -FilePath $batchFile -Encoding ASCII -Force
          
          # Ejecutar el batch (asíncrono)
          $null = Start-Process -FilePath $batchFile -WindowStyle Hidden -PassThru
          Start-Sleep -Milliseconds 300
          Remove-Item $batchFile -Force -ErrorAction SilentlyContinue
          
          Write-Host "Cloudflared iniciado en background..."
          
          # Intentar obtener PID de cloudflared
          Start-Sleep -Seconds 2
          $cloudflaredProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Select-Object -First 1
          if ($cloudflaredProcess) {
            Write-Host "Cloudflared iniciado con PID: $($cloudflaredProcess.Id)"
          } else {
            Write-Host "Cloudflared iniciado (PID no disponible aún)"
          }
          
          # Esperar y capturar la URL (máx 45s)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $url = $null
          $deadline = (Get-Date).AddSeconds(45)
          
          Write-Host "Esperando a que cloudflared genere la URL..."
          while ((Get-Date) -lt $deadline -and -not $url) {
            Start-Sleep -Seconds 2
            $content = ""
            if (Test-Path $logFile) {
              try { $content += Get-Content $logFile -Raw -ErrorAction SilentlyContinue } catch {}
            }
            if (Test-Path $logErr) {
              try { $content += Get-Content $logErr -Raw -ErrorAction SilentlyContinue } catch {}
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
            
            # Verificar que el túnel esté funcionando
            Write-Host "Verificando que el túnel esté funcionando..."
            Start-Sleep -Seconds 3
            try {
              $tunnelResponse = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
              if ($tunnelResponse.StatusCode -eq 200) {
                Write-Host "✅ Túnel verificado y funcionando correctamente"
              } else {
                Write-Host "⚠️ Túnel responde pero con código: $($tunnelResponse.StatusCode)"
              }
            } catch {
              Write-Host "⚠️ El túnel no está respondiendo correctamente: $($_.Exception.Message)"
              Write-Host "Esto puede ser normal si el servidor local no está completamente listo"
            }
          } else {
            Write-Host "⚠️ No se pudo capturar la URL en 45 segundos"
            if (Test-Path $logFile) {
              Write-Host "=== Últimas 30 líneas de stdout ==="
              Get-Content $logFile -Tail 30 | Write-Host
            }
            if (Test-Path $logErr) {
              Write-Host "=== Últimas 30 líneas de stderr ==="
              Get-Content $logErr -Tail 30 | Write-Host
            }
            $cfProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
            if ($cfProcess) {
              Write-Host "Cloudflared está corriendo (PID: $($cfProcess.Id))"
            } else {
              Write-Host "⚠️ Cloudflared no está corriendo - puede haber fallado al iniciar"
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
          
          # Salida exitosa del paso de PowerShell
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
        // Asegura que el job sale con éxito
        bat 'echo Pipeline completado exitosamente && exit /b 0'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'cloudflared.out,cloudflared.err,tunnel_url.txt,server.log', onlyIfSuccessful: false
      echo "✅ Pipeline terminado. Servicios siguen corriendo en background."
    }
  }
}
