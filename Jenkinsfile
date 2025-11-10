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
