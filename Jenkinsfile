// ============================================================
//  Pipeline CI/CD - Sistema de Inventario
//  Empresa (ficticia): TecnoSoluciones del Caribe S.A.S.
// ------------------------------------------------------------
//  Flujo:  Checkout -> Build & Test backend -> Lint frontend
//          -> Build imagen Docker -> Deploy (docker compose)
//          -> Smoke test del endpoint de salud
//
//  Se dispara automaticamente por Webhook tras cada Pull Request
//  o push a la rama main (configurar en GitHub/GitLab -> Webhooks).
// ============================================================

pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        BACKEND_DIR   = 'backend/backend'
        FRONTEND_DIR  = 'frontend/inventario-app'
        IMAGE_NAME    = 'inventario-backend'
        IMAGE_TAG     = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Clonando codigo fuente - build #${env.BUILD_NUMBER}"
                checkout scm
            }
        }

        stage('Backend: Build & Pruebas Unitarias') {
            steps {
                dir("${BACKEND_DIR}") {
                    // En Windows usar bat 'mvnw.cmd ...'
                    sh 'chmod +x mvnw'
                    sh './mvnw -B clean test'
                    sh './mvnw -B package -DskipTests'
                }
            }
            post {
                always {
                    // Publica el reporte de pruebas (JUnit) en Jenkins
                    junit allowEmptyResults: true, testResults: "${BACKEND_DIR}/target/surefire-reports/*.xml"
                    archiveArtifacts artifacts: "${BACKEND_DIR}/target/*.jar", allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        stage('Frontend: Instalacion & Lint') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm ci'
                    sh 'npm run lint'
                }
            }
        }

        stage('Build Imagen Docker') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Deploy (docker compose)') {
            steps {
                echo 'Desplegando stack: backend + prometheus + grafana'
                sh 'docker compose up -d --build'
            }
        }

        stage('Smoke Test (salud del servicio)') {
            steps {
                echo 'Verificando que el backend responde /actuator/health ...'
                sh '''
                  for i in $(seq 1 20); do
                    if curl -sf http://localhost:8080/actuator/health | grep -q "UP"; then
                      echo "Backend ARRIBA"; exit 0;
                    fi
                    echo "Esperando al backend... ($i/20)"; sleep 5;
                  done
                  echo "El backend no respondio a tiempo"; exit 1;
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline EXITOSO. Imagen ${IMAGE_NAME}:${IMAGE_TAG} desplegada."
        }
        failure {
            echo 'Pipeline FALLIDO. Revisar la etapa marcada en rojo.'
        }
        always {
            echo "Resultado final: ${currentBuild.currentResult}"
        }
    }
}
