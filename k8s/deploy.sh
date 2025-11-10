#!/bin/bash

# Script para desplegar la aplicación Biblioteca Xonler en Kubernetes
# Uso: ./deploy.sh

set -e

echo "🚀 Desplegando Biblioteca Xonler en Kubernetes..."

# Aplicar en orden de dependencias
echo "📦 Creando namespace..."
kubectl apply -f namespace.yaml

echo "⚙️  Creando ConfigMaps..."
kubectl apply -f configmap.yaml
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f grafana-configmap.yaml
kubectl apply -f postgresql-init-script-configmap.yaml

echo "🔐 Creando Secrets..."
kubectl apply -f secrets.yaml

echo "💾 Creando PersistentVolumeClaims..."
kubectl apply -f persistent-volumes.yaml

echo "🐘 Desplegando PostgreSQL..."
kubectl apply -f postgresql-deployment.yaml
kubectl apply -f postgresql-service.yaml

echo "⏳ Esperando a que PostgreSQL esté listo..."
kubectl wait --for=condition=ready pod -l app=postgresql -n biblioteca-xonler --timeout=300s

echo "🗄️  Ejecutando script de inicialización de base de datos..."
kubectl apply -f postgresql-init-job.yaml
echo "⏳ Esperando a que el Job de inicialización complete..."
if kubectl wait --for=condition=complete job/postgresql-init-job -n biblioteca-xonler --timeout=300s; then
    echo "✅ Base de datos inicializada correctamente"
else
    echo "⚠️  El Job de inicialización puede haber fallado. Verifica los logs:"
    echo "   kubectl logs -n biblioteca-xonler job/postgresql-init-job"
fi

echo "📊 Desplegando PostgreSQL Exporter..."
kubectl apply -f postgres-exporter-deployment.yaml

echo "🌐 Desplegando aplicación Node.js..."
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml

echo "📈 Desplegando Prometheus..."
kubectl apply -f prometheus-deployment.yaml

echo "📊 Desplegando Grafana..."
kubectl apply -f grafana-deployment.yaml

echo "📦 Desplegando cAdvisor (DaemonSet)..."
kubectl apply -f cadvisor-daemonset.yaml

echo "🗄️  Desplegando DBeaver..."
kubectl apply -f dbeaver-deployment.yaml

echo "🔧 Desplegando Jenkins..."
kubectl apply -f jenkins-deployment.yaml

echo "✅ Despliegue completado!"
echo ""
echo "📋 Verificar el estado de los pods:"
echo "   kubectl get pods -n biblioteca-xonler"
echo ""
echo "🌐 Servicios expuestos (NodePort):"
echo "   - Aplicación:     http://localhost:30000"
echo "   - Grafana:        http://localhost:30001"
echo "   - Prometheus:     http://localhost:30090"
echo "   - Jenkins:        http://localhost:30088"
echo "   - cAdvisor:       http://localhost:30080"
echo "   - DBeaver:        http://localhost:30978"
echo ""
echo "📊 Ver logs:"
echo "   kubectl logs -n biblioteca-xonler <pod-name>"
echo ""
echo "🗑️  Para eliminar todo:"
echo "   kubectl delete namespace biblioteca-xonler"

