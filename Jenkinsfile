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

    stage('Tunnel (cloudflared) - safe start') {
      steps {
        // Lanzar cloudflared definitivamente DETACHED y salir inmediatamente
        powershell(returnStatus: true, script: '''
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          $ws  = $env:WORKSPACE
          $log = Join-Path $ws "cloudflared.log"
          $tf  = Join-Path $ws "tunnel-url.txt"

          # intentar matar instancias previas para no duplicar
          try { Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}

          # si no existe, intentar descargar (silencioso)
          if (-not (Test-Path $exe)) {
            try {
              Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing -ErrorAction SilentlyContinue
            } catch {}
          }

          # limpiar logs previos
          Remove-Item -Path $log,$tf -Force -ErrorAction SilentlyContinue | Out-Null

          if (-not (Test-Path $exe)) {
            Write-Host "⚠️ cloudflared.exe no está disponible en $exe. Escribiendo fallback y saliendo."
            Set-Content -Path $tf -Value "http://127.0.0.1:3000" -Encoding UTF8
            exit 0
          }

          # Usar cmd start /B vía Start-Process para asegurar DETACHED
          $cmd = "start \"\" /B `"$exe`" tunnel --config NUL --no-autoupdate --url http://127.0.0.1:3000 > `"$log`" 2>&1"
          Start-Process -FilePath cmd.exe -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null

          # no esperamos al proceso aquí más de lo necesario: hacemos un pequeño polling para capturar la URL (max 30s)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $found = $false
          for ($i=0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 1
            if (Test-Path $log) {
              try { $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue } catch { $txt = "" }
              if ($txt -match $regex) {
                $url = $matches[0]
                Set-Content -Path $tf -Value $url -Encoding UTF8
                Write-Host "✅ TUNNEL_URL=$url"
                $found = $true
                break
              }
            }
          }

          if (-not $found) {
            Write-Host "⚠️ No se obtuvo URL en 30s. Escribo fallback y continúo."
            Set-Content -Path $tf -Value "http://127.0.0.1:3000" -Encoding UTF8
          }

          # Forzar salida del step: cloudflared queda corriendo en background
          exit 0
        ''')

        // Exportar la URL al env para stages posteriores
        script {
          def tf = "${env.WORKSPACE}\\tunnel-url.txt"
          env.TUNNEL_URL = fileExists(tf) ? readFile(tf).trim() : 'http://127.0.0.1:3000'
          echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
        }

        // Asegurar que no quedan códigos de error que hagan fallar el stage
        bat 'cmd /c exit /b 0'
      }
    }
  }
}

