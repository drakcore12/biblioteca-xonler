pipeline {
    // Usar agente Docker con Node.js preinstalado (recomendado)
    // O cambiar a 'agent any' si tienes Node.js instalado en el servidor
    agent any

    environment {
        NODE_ENV = 'test'
        DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/biblioteca_test'
        JWT_SECRET = 'test-secret-key'
    }

    // Si tienes el plugin de Node.js configurado, descomenta esto:
    // tools {
    //     nodejs 'NodeJS'
    // }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verificar Node.js') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            # Verificar si Node.js está instalado
                            if ! command -v node &> /dev/null; then
                                echo "❌ Node.js no encontrado"
                                echo ""
                                echo "SOLUCIONES:"
                                echo "1. Instala el plugin 'NodeJS Plugin' en Jenkins"
                                echo "2. Configura Node.js en: Manage Jenkins → Global Tool Configuration"
                                echo "3. O instala Node.js manualmente en el contenedor/servidor:"
                                echo "   docker exec -it jenkins bash"
                                echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
                                echo "   apt-get update && apt-get install -y nodejs"
                                echo ""
                                exit 1
                            fi
                            echo "✅ Node.js encontrado:"
                            node --version
                            npm --version
                        '''
                    } else {
                        bat '''
                            @echo off
                            where node >nul 2>&1
                            if %errorlevel% neq 0 (
                                echo ⚠️  Node.js no encontrado en el PATH
                                echo.
                                echo SOLUCIONES:
                                echo 1. Instala Node.js desde https://nodejs.org/
                                echo 2. O configura el plugin de Node.js en Jenkins
                                echo.
                                exit 1
                            )
                            echo ✅ Node.js encontrado:
                            node --version
                            npm --version
                        '''
                    }
                }
            }
        }

        stage('Instalar dependencias') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Pruebas Unitarias (Jest)') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/**/*.xml'
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report',
                        keepAll: true,
                        alwaysLinkToLastBuild: true,
                        allowMissing: false
                    ])
                }
            }
        }

        stage('Pruebas E2E (Playwright)') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npx playwright install --with-deps'
                        sh 'npx playwright test'
                    } else {
                        bat 'npx playwright install --with-deps'
                        bat 'npx playwright test'
                    }
                }
            }
            post {
                always {
                    publishHTML([
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report',
                        keepAll: true,
                        alwaysLinkToLastBuild: true,
                        allowMissing: false
                    ])
                }
            }
        }

        stage('Pruebas de Carga (Artillery)') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm install -g artillery'
                        sh 'artillery run artillery-config.yml --output test-results/load-report.json'
                    } else {
                        bat 'npm install -g artillery'
                        bat 'artillery run artillery-config.yml --output test-results/load-report.json'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/load-report.json', fingerprint: true
                }
            }
        }

        // CD - Despliegue (solo si todas las pruebas pasan y es rama main)
        stage('Desplegar Localmente') {
            when {
                allOf {
                    branch 'main'
                    expression { 
                        // Solo si todas las etapas anteriores fueron exitosas
                        return currentBuild.result == null || currentBuild.result == 'SUCCESS'
                    }
                }
            }
            steps {
                script {
                    echo '🚀 Iniciando despliegue local...'
                    
                    // Detener servidor anterior si existe (compatible Windows/Linux)
                    if (isUnix()) {
                        sh '''
                            pkill -f "node src/server.js" || true
                            sleep 2
                        '''
                    } else {
                        bat '''
                            @echo off
                            for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do (
                                taskkill /F /PID %%a >nul 2>&1
                            )
                            timeout /t 2 /nobreak >nul
                        '''
                    }
                    
                    // Instalar dependencias de producción
                    if (isUnix()) {
                        sh 'npm ci --production'
                    } else {
                        bat 'npm ci --production'
                    }
                    
                    // Iniciar servidor en background
                    if (isUnix()) {
                        sh '''
                            nohup npm start > server.log 2>&1 &
                            echo $! > server.pid
                            sleep 5
                        '''
                    } else {
                        bat '''
                            @echo off
                            start /B npm start > server.log 2>&1
                            timeout /t 5 /nobreak >nul
                        '''
                    }
                    
                    // Verificar que el servidor está corriendo
                    if (isUnix()) {
                        sh '''
                            for i in {1..10}; do
                                if curl -f http://localhost:3000 > /dev/null 2>&1; then
                                    echo "✅ Servidor desplegado correctamente en localhost:3000"
                                    exit 0
                                fi
                                echo "Esperando servidor... ($i/10)"
                                sleep 2
                            done
                            echo "❌ Error: Servidor no respondió"
                            exit 1
                        '''
                    } else {
                        bat '''
                            @echo off
                            set /a attempts=0
                            :check
                            set /a attempts+=1
                            curl -f http://localhost:3000 >nul 2>&1
                            if %errorlevel% equ 0 (
                                echo ✅ Servidor desplegado correctamente en localhost:3000
                                exit /b 0
                            )
                            if %attempts% geq 10 (
                                echo ❌ Error: Servidor no respondió
                                exit /b 1
                            )
                            echo Esperando servidor... (%attempts%/10)
                            timeout /t 2 /nobreak >nul
                            goto check
                        '''
                    }
                }
            }
            post {
                success {
                    echo '✅ Aplicación desplegada exitosamente en localhost:3000'
                }
                failure {
                    echo '❌ Error al desplegar la aplicación'
                }
            }
        }

        // Exponer aplicación a internet con Cloudflare Tunnel
        stage('Cloudflare Tunnel') {
            when {
                allOf {
                    branch 'main'
                    expression { 
                        return currentBuild.result == null || currentBuild.result == 'SUCCESS'
                    }
                }
            }
            steps {
                script {
                    echo '🌐 Configurando Cloudflare Tunnel...'
                    
                    // Detener tunnel anterior si existe (compatible Windows/Linux)
                    if (isUnix()) {
                        sh '''
                            pkill -f cloudflared || true
                            sleep 2
                        '''
                    } else {
                        powershell '''
                            Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                            Start-Sleep -Seconds 2
                            Write-Host "✅ Procesos anteriores de cloudflared detenidos (si existían)"
                        '''
                    }
                    
                    // Verificar que cloudflared está instalado
                    if (isUnix()) {
                        sh '''
                            if ! command -v cloudflared &> /dev/null; then
                                echo "⚠️  cloudflared no está instalado"
                                echo "Por favor, instala cloudflared manualmente"
                                exit 1
                            fi
                        '''
                    } else {
                        powershell '''
                            $cloudflaredPath = Join-Path $env:USERPROFILE "cloudflared.exe"
                            if (-not (Test-Path $cloudflaredPath)) {
                                Write-Host "⚠️  cloudflared no está instalado en $cloudflaredPath"
                                Write-Host "Por favor, instala cloudflared manualmente:"
                                Write-Host "winget install Cloudflare.Cloudflared"
                                exit 1
                            }
                            Write-Host "✅ cloudflared encontrado en: $cloudflaredPath"
                        '''
                    }
                    
                    // Iniciar Cloudflare Tunnel
                    if (isUnix()) {
                        sh '''
                            nohup cloudflared tunnel --url http://localhost:3000 > cloudflare.log 2>&1 &
                            echo $! > cloudflare.pid
                            sleep 5
                        '''
                    } else {
                        powershell '''
                            $cloudflaredPath = Join-Path $env:USERPROFILE "cloudflared.exe"
                            Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel", "--config", "NUL", "--url", "http://127.0.0.1:3000" -NoNewWindow -RedirectStandardOutput "cloudflare.log" -RedirectStandardError "cloudflare.log"
                            Start-Sleep -Seconds 5
                            Write-Host "✅ Cloudflare Tunnel iniciado"
                        '''
                    }
                    
                    // Extraer URL pública del log
                    if (isUnix()) {
                        sh '''
                            if [ -f cloudflare.log ]; then
                                URL=$(grep -o "https://[a-z0-9-]*\\.trycloudflare\\.com" cloudflare.log | head -1)
                                if [ -n "$URL" ]; then
                                    echo "🌐 URL pública generada: $URL"
                                    echo "URL_PUBLICA=$URL" > cloudflare-url.env
                                else
                                    echo "⚠️  No se pudo extraer la URL del log"
                                    echo "Revisa cloudflare.log para más detalles"
                                fi
                            fi
                        '''
                    } else {
                        powershell '''
                            if (Test-Path "cloudflare.log") {
                                $content = Get-Content "cloudflare.log" -Raw
                                $pattern = "https://[a-z0-9-]+" + [regex]::Escape(".trycloudflare.com")
                                $urlMatch = [regex]::Match($content, $pattern)
                                if ($urlMatch.Success) {
                                    $url = $urlMatch.Value
                                    Write-Host "🌐 URL pública generada: $url"
                                    "URL_PUBLICA=$url" | Out-File -FilePath "cloudflare-url.env" -Encoding utf8
                                } else {
                                    Write-Host "⚠️  No se pudo extraer la URL del log"
                                    Write-Host "Revisa cloudflare.log para más detalles"
                                    Write-Host "Últimas líneas del log:"
                                    Get-Content "cloudflare.log" -Tail 10
                                }
                            } else {
                                Write-Host "⚠️  Archivo cloudflare.log no encontrado"
                            }
                        '''
                    }
                }
            }
            post {
                success {
                    script {
                        if (fileExists('cloudflare-url.env')) {
                            def urlFile = readFile('cloudflare-url.env')
                            def url = urlFile.split('=')[1]?.trim()
                            if (url) {
                                echo "✅ Cloudflare Tunnel activo"
                                echo "🌐 URL pública: ${url}"
                                echo "📋 La aplicación está disponible en internet"
                            }
                        }
                    }
                }
                failure {
                    echo '❌ Error al iniciar Cloudflare Tunnel'
                    echo '📋 Revisa cloudflare.log para más detalles'
                }
            }
        }
    }

    post {
        always {
            // No limpiar workspace para mantener logs y archivos
            echo '📋 Pipeline completado'
        }
        success {
            echo '✅ Pipeline exitoso: Pruebas pasadas, aplicación desplegada y expuesta a internet'
            script {
                if (fileExists('cloudflare-url.env')) {
                    def urlFile = readFile('cloudflare-url.env')
                    def url = urlFile.split('=')[1]?.trim()
                    if (url) {
                        echo "🌐 Accede a tu aplicación en: ${url}"
                    }
                }
            }
        }
        failure {
            echo '❌ Pipeline falló: Revisa los logs para más detalles'
        }
        cleanup {
            // Limpiar archivos temporales opcionales
            script {
                if (isUnix()) {
                    sh 'rm -f server.pid cloudflare.pid temp_url.txt || true'
                } else {
                    bat 'del /Q server.pid cloudflare.pid temp_url.txt 2>nul || exit 0'
                }
            }
        }
    }
}

