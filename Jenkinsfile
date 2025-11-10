pipeline {
  agent { label 'windows' }

  stages {
    stage('Instalar dependencias') {
      steps {
        powershell '''
          Write-Host "Instalando dependencias..."
          npm ci
          if ($LASTEXITCODE -ne 0) { 
            Write-Host "npm ci falló, intentando npm install..."
            npm install 
          }
          Write-Host "✅ Dependencias instaladas correctamente"
        '''
      }
    }

    stage('Tests Unitarios') {
      steps {
        powershell '''
          Write-Host "Ejecutando tests unitarios..."
          
          # Asegurar que el directorio test-results existe
          if (-not (Test-Path "test-results")) {
            New-Item -ItemType Directory -Path "test-results" -Force | Out-Null
          }
          
          npm test
          if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Algunos tests unitarios fallaron"
            exit 1
          }
          
          # Verificar que el archivo se generó
          $junitFile = "test-results/junit.xml"
          if (Test-Path $junitFile) {
            Write-Host "✅ Archivo junit.xml generado en: $junitFile"
            Get-Content $junitFile | Select-Object -First 5 | Write-Host
          } else {
            Write-Host "⚠️ Archivo junit.xml no encontrado en: $junitFile"
            # Buscar en otras ubicaciones posibles
            if (Test-Path "junit.xml") {
              Write-Host "✅ Archivo junit.xml encontrado en la raíz"
              Copy-Item "junit.xml" -Destination $junitFile -Force
            }
          }
          
          Write-Host "✅ Tests unitarios completados"
        '''
      }
      post {
        always {
          script {
            def junitFile = 'test-results/junit.xml'
            if (fileExists(junitFile)) {
              junit junitFile
            } else if (fileExists('junit.xml')) {
              junit 'junit.xml'
            } else {
              echo "⚠️ No se encontró archivo junit.xml para publicar"
            }
          }
          archiveArtifacts artifacts: 'test-results/junit.xml,junit.xml', allowEmptyArchive: true
        }
      }
    }

    stage('Tests E2E') {
      steps {
        powershell '''
          Write-Host "Iniciando servidor para tests E2E..."
          $env:HOST = "127.0.0.1"
          $env:PORT = "3000"
          $env:CI = "true"
          
          # Iniciar servidor en background
          $appCmd = 'start "" /B cmd /c "set HOST=' + $env:HOST + '&& set PORT=' + $env:PORT + '&& npm start > server-e2e.log 2>&1"'
          cmd /c $appCmd | Out-Null
          
          # Esperar a que el servidor esté listo
          Write-Host "Esperando a que el servidor esté listo..."
          $maxAttempts = 30
          $attempt = 0
          $serverReady = $false
          
          while ($attempt -lt $maxAttempts -and -not $serverReady) {
            Start-Sleep -Seconds 2
            $attempt++
            try {
              $response = Invoke-WebRequest -Uri "http://$($env:HOST):$($env:PORT)" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
              if ($response.StatusCode -eq 200) {
                $serverReady = $true
                Write-Host "✅ Servidor listo después de $($attempt * 2) segundos"
                break
              }
            } catch {
              if ($attempt % 5 -eq 0) {
                Write-Host "Esperando servidor... (intento $attempt/$maxAttempts)"
              }
            }
          }
          
          if (-not $serverReady) {
            Write-Host "⚠️ Servidor no está listo, pero continuando con tests E2E..."
          }
          
          Write-Host "Ejecutando tests E2E con Playwright..."
          npm run test:e2e
          if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Algunos tests E2E fallaron"
            exit 1
          }
          Write-Host "✅ Tests E2E completados"
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'playwright-report/**/*,server-e2e.log', allowEmptyArchive: true
        }
      }
    }
  }

  post {
    always {
      echo "✅ Pipeline completado"
      archiveArtifacts artifacts: 'junit.xml,test-results/**/*', allowEmptyArchive: true
    }
    success {
      echo "✅ Todos los tests pasaron correctamente"
    }
    failure {
      echo "❌ Algunos tests fallaron"
    }
  }
}
