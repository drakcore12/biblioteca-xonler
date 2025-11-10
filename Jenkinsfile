pipeline {
  agent { label 'windows' }

  stages {
    stage('Iniciar servidor') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          powershell '''
            $ErrorActionPreference = "Continue"
            $env:HOST = "127.0.0.1"
            $env:PORT = "3000"

            # Limpieza previa
            if (Test-Path "server.log") { Remove-Item "server.log" -Force }

            # 1) Instalar dependencias
            Write-Host "Instalando dependencias..."
            npm ci
            if ($LASTEXITCODE -ne 0) { npm install }

            # 2) Levantar la app (queda viva en otro proceso, completamente desacoplado)
            Write-Host "Iniciando servidor Node.js..."
            $appCmd = 'start "" /B cmd /c "set HOST=' + $env:HOST + '&& set PORT=' + $env:PORT + '&& npm start > server.log 2>&1"'
            cmd /c $appCmd | Out-Null
            Start-Sleep -Seconds 2

            # 3) Esperar a que el servidor esté listo (máx 30s, verificación rápida)
            Write-Host "Verificando servidor..."
            $deadline = (Get-Date).AddSeconds(30)
            $serverReady = $false
            
            while ((Get-Date) -lt $deadline -and -not $serverReady) {
              try {
                $response = Invoke-WebRequest -Uri "http://$($env:HOST):$($env:PORT)" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                  $serverReady = $true
                  Write-Host "✅ Servidor listo: http://$($env:HOST):$($env:PORT)"
                  break
                }
              } catch {
                Start-Sleep -Seconds 1
              }
            }
            
            if (-not $serverReady) {
              Write-Host "⚠️ Servidor no respondió en 30s, pero continúa en background"
            }
            
            Write-Host "Finalizando paso..."
            exit 0
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'server.log', onlyIfSuccessful: false
    }
  }
}
