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
        powershell(returnStatus: true, script: '''
          $exe = "$env:USERPROFILE\\cloudflared.exe"
          $ws  = $env:WORKSPACE
          $log = Join-Path $ws "cloudflared.log"
          $tf  = Join-Path $ws "tunnel-url.txt"

          # Evita procesos previos colgados
          try { Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}

          # Descargar si no existe
          if (-not (Test-Path $exe)) {
            Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $exe -UseBasicParsing -ErrorAction SilentlyContinue
          }

          # Logs limpios
          Remove-Item $log,$tf -Force -ErrorAction SilentlyContinue | Out-Null

          # Lanzar DETACHED vía cmd start /B para no acoplar stdout/err a este proceso
          $cmd = "start \"\" /B `"$exe`" tunnel --config NUL --no-autoupdate --url http://127.0.0.1:3000 > `"$log`" 2>&1"
          Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden | Out-Null

          # Poll hasta 60s buscando URL
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $found = $false
          for($i=1; $i -le 60 -and -not $found; $i++){
            Start-Sleep -Seconds 1
            if (Test-Path $log) {
              try { $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue } catch { $txt = "" }
              if ($txt -match $regex) {
                $url = $matches[0]
                Set-Content -Path $tf -Value ($url + "`r`n") -Encoding UTF8
                Write-Host "TUNNEL_URL=$url"
                $found = $true
                break
              }
            }
          }

          if (-not $found) {
            Write-Host "⚠️  No se obtuvo URL; usando fallback localhost"
            Set-Content -Path $tf -Value "http://127.0.0.1:3000`r`n" -Encoding UTF8
          }

          # ¡Clave! Forzar final del paso para que Jenkins no espere más
          exit 0
        ''')

        script {
          def tf = "${env.WORKSPACE}\\tunnel-url.txt"
          env.TUNNEL_URL = fileExists(tf) ? readFile(tf).trim() : 'http://127.0.0.1:3000'
          echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
        }

        // Extra: limpia cualquier ERRORLEVEL residual en Windows
        bat 'cmd /c exit /b 0'
      }
    }
  }
}

