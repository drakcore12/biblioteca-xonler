pipeline {
  agent { label 'windows host' } // tu agente Windows

  environment {
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main'
  }

  stages {
    stage('npm install & start + cloudflared') {
      steps {
        dir("${env.PROJECT_PATH}") {
          // Instalar deps (rápido si ya existe lockfile)
          bat 'npm ci || npm install'

          // Matar cualquier node viejo (opcional)
          bat 'taskkill /F /IM node.exe >nul 2>&1 || echo no-node'

          // Arrancar la app en background (HOST/PORT locales)
          bat 'start "" cmd /c "set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"'

          // Arrancar cloudflared en background
          powershell '''
            Start-Process -WindowStyle Hidden `
              -FilePath "$env:USERPROFILE\\cloudflared.exe" `
              -ArgumentList @("tunnel","--config","NUL","--url","http://127.0.0.1:3000")
          '''
        }
      }
    }
  }
}
