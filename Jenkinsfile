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
  }

  post {
    always {
      echo "✅ Pipeline completado"
    }
  }
}
