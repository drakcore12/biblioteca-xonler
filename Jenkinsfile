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
        // Arranca el server en 127.0.0.1:3000 de forma completamente independiente
        bat 'start "" /B cmd /c "cd /d %WORKSPACE% && set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"'
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
          
          # Ejecutar cloudflared de forma completamente independiente usando start /B
          $cmd = "start \"\" /B cmd /c `"$exe`" tunnel --config NUL --url http://127.0.0.1:3000 > `"$log`" 2>&1"
          cmd /c $cmd
          
          # Esperar un poco para que cloudflared inicie y genere la URL
          Start-Sleep -Seconds 5
          
          # Intentar capturar la URL rápidamente (máximo 15 segundos)
          $regex = 'https://[a-z0-9-]+\\.trycloudflare\\.com'
          $url = $null
          
          for ($i=0; $i -lt 15; $i++) {
            if (Test-Path $log) {
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
            if ($i -lt 14) {
              Start-Sleep -Seconds 1
            }
          }
          
          if (-not $url) {
            Write-Host "⚠️ URL no encontrada aún, pero cloudflared está corriendo. Se leerá después."
          }
        '''
        script {
          def url = null
          if (fileExists('tunnel-url.txt')) {
            url = readFile('tunnel-url.txt').trim()
          } else if (fileExists('cloudflared.log')) {
            // Fallback: leer directamente del log
            def logContent = readFile('cloudflared.log')
            def matcher = logContent =~ /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
            if (matcher.find()) {
              url = matcher.group(0)
            }
          }
          
          if (url) {
            env.TUNNEL_URL = url
            echo "🌐 TUNNEL_URL = ${env.TUNNEL_URL}"
          } else {
            echo "⚠️ No se pudo obtener la URL del túnel"
          }
        }
      }
    }
  }
}

