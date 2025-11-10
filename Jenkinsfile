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

