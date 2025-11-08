pipeline {
  agent none

  environment {
    // App & DB
    NODE_ENV     = 'test'
    DB_HOST      = 'host.docker.internal'
    DB_PORT      = '5432'
    DB_NAME      = 'xonler'
    DB_USER      = 'postgres'
    DB_PASSWORD  = 'postgres'
    DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    JWT_SECRET   = 'test-secret-key'

    // Nodo Windows y rutas
    WINDOWS_NODE = 'windows host'
    PROJECT_PATH = 'C:/Users/MIGUEL/Documents/Proyectos-Cursor/Biblioteca-Xonler-main'
    SERVER_PORT  = '3000'
    SERVER_URL   = "http://127.0.0.1:${SERVER_PORT}"
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      agent { label 'windows' }
      steps {
        checkout scm
        // Sincroniza workspace -> PROJECT_PATH (solo difs)
        bat 'if not exist "%PROJECT_PATH%" mkdir "%PROJECT_PATH%"'
        bat 'robocopy "%WORKSPACE%" "%PROJECT_PATH%" /MIR /NFL /NDL /NJH /NJS /NP >nul || exit /b 0'
      }
    }

    stage('Instalar dependencias') {
      agent { label 'windows' }
      steps {
        dir("${env.PROJECT_PATH}") {
          bat 'npm ci'
        }
      }
    }

    stage('Verificar PostgreSQL') {
      agent { label 'windows' }
      steps {
        // Si ya tienes el servicio instalado, basta con verificar que esté "Running"
        powershell '''
          $svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
          if(-not $svc){ Write-Host "⚠️ PostgreSQL service no encontrado (continúa si usas Docker u otra instancia)"; exit 0 }
          if($svc.Status -ne "Running"){ Start-Service $svc.Name; Start-Sleep -s 3 }
          $svc = Get-Service -Name $svc.Name
          if($svc.Status -ne "Running"){ Write-Error "PostgreSQL no inició"; exit 1 }
          Write-Host "✅ PostgreSQL en estado: $($svc.Status)"
        '''
      }
    }

    stage('Iniciar servidor') {
      agent { label 'windows' }
      steps {
        dir("${env.PROJECT_PATH}") {
          // Cierra node anterior de este proyecto (si hubiera) e inicia npm start en background
          bat '''
            @echo off
            for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do (
              wmic process where "ProcessId=%%a and CommandLine like '%%Biblioteca-Xonler-main%%'" call terminate >nul 2>&1
            )
            start /B cmd /c "npm start > server.log 2>&1"
          '''
          // Healthcheck simple (usa /health si lo tienes; si no, prueba "/")
          powershell '''
            $ok=$false
            for($i=0;$i -lt 20;$i++){
              try{
                $r=Invoke-WebRequest "$env:SERVER_URL/health" -UseBasicParsing -TimeoutSec 3
                if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $ok=$true; Write-Host "✅ Servidor OK"; break }
              }catch{}
              Start-Sleep -s 2
            }
            if(-not $ok){ Write-Error "Servidor no respondió en $env:SERVER_URL"; exit 1 }
          '''
        }
      }
    }

    stage('Tests unitarios + cobertura') {
      agent { label 'windows' }
      steps {
        dir("${env.PROJECT_PATH}") {
          bat 'if not exist test-results mkdir test-results'
          // Asegúrate de que package.json tenga script "test:unit": "jest --coverage --ci --reporters=default --reporters=jest-junit"
          bat 'npm run test:unit'
          // Publica JUnit y Coverage (no falla si falta la carpeta)
          junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
          publishHTML(target: [
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
      }
    }

    stage('Carga (Artillery)') {
      agent { label 'windows' }
      steps {
        dir("${env.PROJECT_PATH}") {
          bat 'if not exist test-results mkdir test-results'
          bat 'npm list -g artillery || npm install -g artillery'
          // Ejecuta con debug útil para ver códigos de respuesta
          bat 'set ARTILLERY_DEBUG=http,http:response && artillery run artillery-config.yml --output test-results\\load-report.json'
          archiveArtifacts artifacts: 'test-results/load-report.json', fingerprint: true, onlyIfSuccessful: false, allowEmptyArchive: true
        }
      }
    }

    stage('Cloudflare Tunnel (opcional)') {
      when { expression { return true } } // cambia a false si no quieres abrir túnel en cada build
      agent { label 'windows' }
      steps {
        dir("${env.PROJECT_PATH}") {
          // Intenta cerrar anteriores e inicia cloudflared hacia 127.0.0.1:3000
          bat 'taskkill /IM cloudflared.exe /F >nul 2>&1 || echo No process'
          powershell '''
            $log = Join-Path $env:PROJECT_PATH "cloudflare.log"
            Remove-Item $log -ErrorAction SilentlyContinue
            $exe = Join-Path $env:USERPROFILE "cloudflared.exe"
            if(-not (Test-Path $exe)){ Write-Host "⚠️ cloudflared no encontrado en $exe (instálalo con winget install Cloudflare.Cloudflared)"; exit 0 }
            Start-Process -FilePath $exe -ArgumentList "tunnel","--config","NUL","--url","http://127.0.0.1:3000" -NoNewWindow -RedirectStandardOutput $log -RedirectStandardError $log
            Start-Sleep -Seconds 5
            if(Test-Path $log){
              $content = Get-Content $log -Raw
              $m = [regex]::Match($content, "https://[a-z0-9-]+\\.trycloudflare\\.com")
              if($m.Success){ Write-Host "🌐 URL pública: $($m.Value)" } else { Write-Host "⚠️ No se encontró URL en cloudflare.log" }
            }
          '''
        }
      }
    }
  }

  post {
    always {
      echo '📋 Pipeline completado'
    }
  }
}
