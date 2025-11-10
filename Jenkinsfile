pipeline {
  agent { label 'windows host' }
  tools { git 'Default' }              // Asegúrate de tener esta instalación en Manage Jenkins → Tools

  stages {
    stage('Checkout') {
      steps {
        deleteDir()
        checkout scm                   // Clona el repo donde está este Jenkinsfile
      }
    }

    stage('Install & Start') {
      steps {
        bat 'npm ci || npm install'
        // Arranca el server en 127.0.0.1:3000 y deja logs en server.log
        bat 'start "" cmd /c "set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"'
      }
    }

    stage('Tunnel (cloudflared)') {
      steps {
        powershell '''
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          $log = Join-Path $env:WORKSPACE "cloudflared.log"
          
          # Descargar si no existe
          if (-not (Test-Path $exe)) {
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing
          }
          
          # Limpiar log previo
          Remove-Item -Path $log -Force -ErrorAction SilentlyContinue
          
          # Ejecutar cloudflared en background con redirección a log
          $cmd = "start \"\" /B `"$exe`" tunnel --config NUL --url http://127.0.0.1:3000 > `"$log`" 2>&1"
          Start-Process -FilePath cmd.exe -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null
          
          # Esperar un poco para que cloudflared inicie
          Start-Sleep -Seconds 3
          
          # Esperar y capturar la URL (aumentado a 60 segundos)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $url = $null
          $lastSize = 0
          
          for ($i=0; $i -lt 60; $i++) {
            Start-Sleep -Seconds 1
            if (Test-Path $log) {
              try {
                # Leer solo las líneas nuevas para ser más eficiente
                $currentSize = (Get-Item $log).Length
                if ($currentSize -gt $lastSize) {
                  $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
                  if ($txt -match $regex) {
                    $url = $matches[0]
                    Write-Host "✅ TUNNEL_URL=$url"
                    Set-Content -Path (Join-Path $env:WORKSPACE 'tunnel-url.txt') -Value $url
                    break
                  }
                  $lastSize = $currentSize
                }
              } catch {
                # Si hay error, intentar leer todo el archivo de nuevo
                try {
                  $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
                  if ($txt -match $regex) {
                    $url = $matches[0]
                    Write-Host "✅ TUNNEL_URL=$url"
                    Set-Content -Path (Join-Path $env:WORKSPACE 'tunnel-url.txt') -Value $url
                    break
                  }
                } catch {}
              }
            }
          }
          
          # Si aún no se encontró, intentar leer el archivo completo una última vez
          if (-not $url -and (Test-Path $log)) {
            try {
              $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
              if ($txt -match $regex) {
                $url = $matches[0]
                Write-Host "✅ TUNNEL_URL=$url"
                Set-Content -Path (Join-Path $env:WORKSPACE 'tunnel-url.txt') -Value $url
              }
            } catch {}
          }
          
          if (-not $url) {
            Write-Host "⚠️ No se pudo obtener la URL del túnel en el tiempo esperado"
          }
        '''
        script {
          if (fileExists('tunnel-url.txt')) {
            env.TUNNEL_URL = readFile('tunnel-url.txt').trim()
            echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
          }
        }
      }
    }
  }
}

