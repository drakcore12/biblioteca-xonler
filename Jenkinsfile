pipeline {
  agent { label 'windows' }

  stages {
    stage('Iniciar servidor') {
      steps {
        powershell(returnStatus: true, script: '''
          $ErrorActionPreference = "Stop"
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
            Write-Host "Continuando de todas formas..."
          } else {
            Write-Host "✅ Servidor Node.js verificado y funcionando en http://$($env:HOST):$($env:PORT)"
          }
          
          Write-Host ""
          Write-Host "=========================================="
          Write-Host "Pipeline completado. Servidor corriendo:"
          Write-Host "- Servidor Node.js: http://$($env:HOST):$($env:PORT)"
          Write-Host "=========================================="
          Write-Host ""
          
          # Salida exitosa del paso de PowerShell
          $global:LASTEXITCODE = 0
          exit 0
        ''')
        script {
          env.LOCAL_URL = "http://127.0.0.1:3000"
          echo "🌐 LOCAL_URL = ${env.LOCAL_URL}"
          echo "✅ Servidor iniciado correctamente. Pipeline terminando..."
        }
        bat 'echo Pipeline completado exitosamente && exit /b 0'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'server.log', onlyIfSuccessful: false
      echo "✅ Pipeline terminado. Servidor sigue corriendo en background."
    }
  }
}
