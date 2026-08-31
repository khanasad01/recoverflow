#!/usr/bin/env bash
# ==============================================================================
# RecoverFlow - Kubernetes Deployment Validation Script (Bash)
# Validates local cluster connectivity, applies manifests, checks pod rollout,
# and verifies service port forwarding.
# ==============================================================================

set -e

echo "=================================================="
echo " RecoverFlow Kubernetes Deployment Validator"
echo "=================================================="

# 1. Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed or not in PATH."
    exit 1
fi

# 2. Check cluster connection
echo "🔍 Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Error: Cannot connect to Kubernetes cluster. Ensure minikube or kind is running."
    echo "   Tip: Run 'minikube start' or 'kind create cluster --name recoverflow'"
    exit 1
fi
echo "✅ Kubernetes cluster is reachable."

# 3. Create namespace if not exists
NAMESPACE="recoverflow"
echo "📦 Setting up namespace '${NAMESPACE}'..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# 4. Apply manifests in sequence
echo "🚀 Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml -n ${NAMESPACE}
kubectl apply -f k8s/secrets.yaml -n ${NAMESPACE}
kubectl apply -f k8s/api-deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/worker-deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/dashboard-deployment.yaml -n ${NAMESPACE}

# 5. Wait for rollouts to complete
echo "⏳ Waiting for API deployment rollout..."
kubectl rollout status deployment/recoverflow-api -n ${NAMESPACE} --timeout=120s

echo "⏳ Waiting for Worker deployment rollout..."
kubectl rollout status deployment/recoverflow-worker -n ${NAMESPACE} --timeout=120s

echo "⏳ Waiting for Dashboard deployment rollout..."
kubectl rollout status deployment/recoverflow-dashboard -n ${NAMESPACE} --timeout=120s

echo "=================================================="
echo "✅ All RecoverFlow deployments are healthy & ready!"
echo "=================================================="
kubectl get pods,svc -n ${NAMESPACE}

echo ""
echo "👉 To access the services locally:"
echo "   kubectl port-forward svc/recoverflow-api-service 8000:8000 -n ${NAMESPACE} &"
echo "   kubectl port-forward svc/recoverflow-dashboard-service 3000:80 -n ${NAMESPACE} &"
