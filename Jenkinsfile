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
          npm test
          if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Algunos tests unitarios fallaron"
            exit 1
          }
          Write-Host "✅ Tests unitarios completados"
        '''
      }
      post {
        always {
          junit 'test-results/junit.xml'
          archiveArtifacts artifacts: 'test-results/junit.xml', allowEmptyArchive: true
        }
      }
    }

    stage('Tests E2E') {
      steps {
        powershell '''
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
          archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
          publishTestResults testResultsPattern: 'test-results/**/*.xml'
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
