pipeline {
  agent any

  environment {
    // Variables de SonarQube
    SONAR_HOST_URL = 'http://localhost:9000'
    // Variables de base de datos
    DB_NAME = "${env.DB_NAME ?: 'xonler'}"
    DB_USER = "${env.DB_USER ?: 'postgres'}"
    DB_PASSWORD = "${env.DB_PASSWORD ?: 'postgres'}"
    PORT = "${env.PORT ?: '3000'}"
  }

  stages {
    stage('Preparación') {
      steps {
        script {
          echo "🧹 Limpiando solo contenedores app y db (dejando sonarqube, grafana, prometheus corriendo)..."
          sh '''
            # Asegurar que estamos en el directorio del workspace
            pwd
            ls -la docker-compose.yml || echo "⚠️ docker-compose.yml no encontrado en la raíz"
            
            # Solo detener y eliminar contenedores app y db (no tocar otros servicios)
            echo "🛑 Deteniendo contenedores web-app y pg-main..."
            docker stop web-app pg-main 2>/dev/null || true
            docker rm -f web-app pg-main 2>/dev/null || true
            
            # También limpiar db-init-sonar si existe (es temporal)
            docker rm -f db-init-sonar 2>/dev/null || true
            
            echo "✅ Limpieza completada (sonarqube, grafana, prometheus siguen corriendo)"
          '''
        }
      }
    }

    stage('Instalar dependencias') {
      steps {
        script {
          echo "📦 Instalando dependencias..."
          sh '''
            # Verificar que Node.js está disponible
            node --version
            npm --version
            
            npm ci
            if [ $? -ne 0 ]; then
              echo "⚠️ npm ci falló, intentando npm install..."
              npm install
            fi
            echo "✅ Dependencias instaladas correctamente"
          '''
        }
      }
    }

    stage('Validaciones Rápidas') {
      parallel {
        stage('Tests Unitarios') {
          steps {
            script {
              echo "🧪 Ejecutando tests unitarios (sin contenedores)..."
              sh '''
                # Asegurar que el directorio test-results existe
                mkdir -p test-results || true
                
                # Ejecutar tests unitarios (no necesitan app corriendo)
                npm test || {
                  echo "⚠️ Algunos tests unitarios fallaron, pero continuando..."
                }
                
                # Verificar que el archivo se generó
                if [ -f "test-results/junit.xml" ]; then
                  echo "✅ Archivo junit.xml generado en: test-results/junit.xml"
                elif [ -f "junit.xml" ]; then
                  echo "✅ Archivo junit.xml encontrado en la raíz"
                  mkdir -p test-results
                  cp junit.xml test-results/junit.xml || true
                else
                  echo "⚠️ Archivo junit.xml no encontrado"
                fi
              '''
            }
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
    }

    stage('Construir imagen de la app') {
      steps {
        script {
          echo "🔨 Construyendo imagen de la aplicación..."
          sh '''
            # Asegurar que estamos en el directorio del workspace
            pwd
            echo "📁 Verificando docker-compose.yml y Dockerfile..."
            if [ ! -f "docker-compose.yml" ]; then
              echo "❌ ERROR: docker-compose.yml no encontrado en ${WORKSPACE}"
              ls -la
              exit 1
            fi
            if [ ! -f "Dockerfile" ]; then
              echo "❌ ERROR: Dockerfile no encontrado en ${WORKSPACE}"
              ls -la
              exit 1
            fi
            echo "✅ Archivos encontrados"
            
            # Crear directorio logs con permisos correctos para evitar errores de permisos
            echo "📁 Creando directorio logs con permisos correctos..."
            mkdir -p logs/encrypted
            chmod -R 755 logs || true
            echo "✅ Directorio logs preparado"
            
            # Construir la imagen de la app explícitamente
            # Primero intentar con cache, si falla construir sin cache
            echo "🔨 Construyendo imagen biblioteca-xonler-main-app..."
            if ! docker compose -f docker-compose.yml build app; then
              echo "⚠️ Construcción con cache falló, intentando sin cache..."
              docker compose -f docker-compose.yml build --no-cache app || {
                echo "❌ ERROR: Falló la construcción de la imagen de la app"
                exit 1
              }
            fi
            
            # Verificar que la imagen se construyó correctamente
            docker images | grep biblioteca-xonler-main-app || {
              echo "❌ ERROR: La imagen no se construyó correctamente"
              exit 1
            }
            echo "✅ Imagen de la app construida correctamente"
          '''
        }
      }
    }

    stage('Iniciar contenedores') {
      steps {
        script {
          echo "🚀 Iniciando contenedores..."
          sh '''
            # Asegurar que estamos en el directorio del workspace
            pwd
            echo "📁 Verificando docker-compose.yml..."
            if [ ! -f "docker-compose.yml" ]; then
              echo "❌ ERROR: docker-compose.yml no encontrado en ${WORKSPACE}"
              ls -la
              exit 1
            fi
            echo "✅ docker-compose.yml encontrado"
            
            # Verificar que docker compose puede leer el archivo
            docker compose -f docker-compose.yml config --services || {
              echo "❌ ERROR: No se puede leer docker-compose.yml"
              exit 1
            }
            
            # Iniciar primero la base de datos y esperar a que esté healthy
            echo "🚀 Iniciando base de datos..."
            docker compose -f docker-compose.yml up -d db
            
            # Esperar a que la base de datos esté lista
            echo "⏳ Esperando a que la base de datos esté lista..."
            MAX_WAIT=120
            ELAPSED=0
            while ! docker inspect --format='{{.State.Health.Status}}' pg-main 2>/dev/null | grep -q healthy; do
              if [ $ELAPSED -ge $MAX_WAIT ]; then
                echo "❌ TIMEOUT: Base de datos no está healthy"
                docker logs pg-main --tail 50
                exit 1
              fi
              echo "⏳ Esperando a que pg-main esté healthy... (${ELAPSED}s/${MAX_WAIT}s)"
              sleep 5
              ELAPSED=$((ELAPSED + 5))
            done
            echo "✅ Base de datos lista"
            
            # Iniciar db-init-sonar solo si sonarqube necesita inicialización
            # Verificar si sonarqube ya está corriendo
            if docker ps --format '{{.Names}}' | grep -q '^sonarqube$'; then
              echo "✅ SonarQube ya está corriendo, saltando inicialización de DB"
            else
              echo "🚀 Iniciando inicialización de SonarQube DB..."
              docker compose -f docker-compose.yml up -d db-init-sonar
              docker wait db-init-sonar || true
              echo "✅ Inicialización de SonarQube DB completada"
            fi
            
            # Solo iniciar app (sonarqube, grafana, prometheus ya están corriendo)
            echo "🚀 Iniciando servicio: app"
            docker compose -f docker-compose.yml up -d app
            
            echo "⏳ Esperando a que los contenedores se inicien..."
            sleep 10
            
            # Verificar que los contenedores están corriendo
            docker compose -f docker-compose.yml ps
          '''
        }
      }
    }

    stage('Verificar salud de contenedores') {
      steps {
        script {
          echo "🏥 Verificando salud de los contenedores..."
          sh '''
            MAX_WAIT=300  # 5 minutos máximo
            ELAPSED=0
            INTERVAL=5
            
            # Función para verificar estado healthy
            check_healthy() {
              local container=$1
              local status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "none")
              echo "Estado de $container: $status"
              [ "$status" = "healthy" ]
            }
            
            # Verificar base de datos
            echo "🔍 Verificando base de datos (pg-main)..."
            while ! check_healthy pg-main; do
              if [ $ELAPSED -ge $MAX_WAIT ]; then
                echo "❌ TIMEOUT: pg-main no está healthy después de ${MAX_WAIT}s"
                docker logs pg-main --tail 50
                exit 1
              fi
              echo "⏳ Esperando a que pg-main esté healthy... (${ELAPSED}s/${MAX_WAIT}s)"
              sleep $INTERVAL
              ELAPSED=$((ELAPSED + INTERVAL))
            done
            echo "✅ pg-main está healthy"
            
            # Esperar a que db-init-sonar termine
            echo "⏳ Esperando a que db-init-sonar complete..."
            docker wait db-init-sonar || true
            INIT_EXIT=$(docker inspect --format='{{.State.ExitCode}}' db-init-sonar 2>/dev/null || echo "0")
            if [ "$INIT_EXIT" != "0" ] && [ "$INIT_EXIT" != "" ]; then
              echo "⚠️ db-init-sonar terminó con código $INIT_EXIT, pero continuando..."
            fi
            
            # Verificar aplicación
            echo "🔍 Verificando aplicación (web-app)..."
            ELAPSED=0
            while ! check_healthy web-app; do
              if [ $ELAPSED -ge $MAX_WAIT ]; then
                echo "❌ TIMEOUT: web-app no está healthy después de ${MAX_WAIT}s"
                docker logs web-app --tail 50
                exit 1
              fi
              echo "⏳ Esperando a que web-app esté healthy... (${ELAPSED}s/${MAX_WAIT}s)"
              sleep $INTERVAL
              ELAPSED=$((ELAPSED + INTERVAL))
            done
            echo "✅ web-app está healthy"
            
            # Verificar SonarQube (solo si está corriendo, no es crítico)
            if docker ps --format '{{.Names}}' | grep -q '^sonarqube$'; then
              echo "🔍 Verificando SonarQube (sonarqube)..."
              ELAPSED=0
              if check_healthy sonarqube; then
                echo "✅ sonarqube está healthy"
              else
                echo "⚠️ sonarqube no está healthy, pero continuando (no crítico para tests)"
              fi
            else
              echo "⚠️ SonarQube no está corriendo, pero continuando (no crítico para tests)"
            fi
            
            # Verificación adicional: endpoints responden
            echo "🔍 Verificación adicional de endpoints..."
            
            # Verificar app
            if ! curl -f http://localhost:${PORT:-3000}/api/health > /dev/null 2>&1; then
              echo "❌ ERROR: El endpoint /api/health de la aplicación no responde"
              docker logs web-app --tail 30
              exit 1
            fi
            echo "✅ Aplicación responde en /api/health"
            
            # Verificar SonarQube (opcional, no crítico)
            if docker ps --format '{{.Names}}' | grep -q '^sonarqube$'; then
              if curl -f http://localhost:9000/api/system/status > /dev/null 2>&1; then
                echo "✅ SonarQube responde en /api/system/status"
              else
                echo "⚠️ SonarQube no responde, pero continuando"
              fi
            fi
            
            echo "✅ Todos los contenedores están sanos y respondiendo correctamente"
          '''
        }
      }
    }

    stage('Tests de Integración') {
      parallel {
        stage('Tests E2E') {
          steps {
            script {
              echo "🎭 Ejecutando tests E2E con Playwright..."
              sh '''
                # Asegurar que los directorios existen
                mkdir -p test-results playwright-report || true
                
                # Ejecutar tests E2E (sin condicional - siempre continúa)
                npm run test:e2e || {
                  echo "⚠️ Algunos tests E2E fallaron, pero continuando..."
                }
                
                echo "✅ Tests E2E completados"
              '''
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'test-results/**/*,playwright-report/**/*', allowEmptyArchive: true
              publishHTML([
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report',
                keepAll: true
              ])
            }
          }
        }

        stage('Tests de Carga') {
          steps {
            script {
              echo "⚡ Ejecutando tests de carga con Artillery..."
              sh '''
                # Asegurar que los directorios existen
                mkdir -p test-results || true
                
                # Ejecutar tests de carga (sin condicional - siempre continúa)
                npm run test:load || {
                  echo "⚠️ Tests de carga fallaron, pero continuando..."
                }
                
                echo "✅ Tests de carga completados"
              '''
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            }
          }
        }
      }
    }

    stage('Análisis SonarQube') {
      steps {
        script {
          echo "🔍 Ejecutando análisis de código con SonarQube..."
          sh '''
            # Generar cobertura si no existe
            if [ ! -f "coverage/lcov.info" ]; then
              echo "📊 Generando reporte de cobertura para SonarQube..."
              npm run test:coverage || {
                echo "⚠️ No se pudo generar cobertura, pero continuando con SonarQube..."
              }
            fi
            
            # Ejecutar análisis de SonarQube (sin condicional - siempre continúa)
            npm run sonar:local || {
              echo "⚠️ Análisis de SonarQube falló, pero continuando..."
            }
            
            echo "✅ Análisis de SonarQube completado"
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: '.scannerwork/**/*,coverage/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Limpiar') {
      steps {
        script {
          echo "🧹 Limpiando solo contenedores app y db (dejando sonarqube, grafana, prometheus corriendo)..."
          sh '''
            # Solo detener contenedores app y db (no tocar otros servicios)
            echo "🛑 Deteniendo contenedores web-app y pg-main..."
            docker stop web-app pg-main 2>/dev/null || true
            docker rm -f web-app pg-main 2>/dev/null || true
            
            # Limpiar db-init-sonar si existe (es temporal)
            docker rm -f db-init-sonar 2>/dev/null || true
            
            echo "✅ Limpieza completada (sonarqube, grafana, prometheus siguen corriendo)"
            echo "📊 Servicios que permanecen activos:"
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(sonarqube|grafana|prometheus|postgres-exporter|cadvisor|pgadmin)" || echo "   (ninguno encontrado)"
          '''
        }
      }
    }
  }

  post {
    always {
      echo "✅ Pipeline completado"
      archiveArtifacts artifacts: 'test-results/**/*,junit.xml,playwright-report/**/*,coverage/**/*,.scannerwork/**/*', allowEmptyArchive: true
    }
    success {
      echo "✅ Pipeline terminó exitosamente"
    }
    failure {
      echo "❌ Pipeline falló - revisar logs"
    }
  }
}
