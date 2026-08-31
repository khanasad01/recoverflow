# ==============================================================================
# RecoverFlow - Kubernetes Deployment Validation Script (PowerShell)
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " RecoverFlow Kubernetes Deployment Validator" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check kubectl
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: kubectl is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check cluster connection
Write-Host "🔍 Checking cluster connectivity..." -ForegroundColor Yellow
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Kubernetes cluster is reachable." -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to cluster. Run 'minikube start' or 'kind create cluster'." -ForegroundColor Red
    exit 1
}

$namespace = "recoverflow"
Write-Host "📦 Creating namespace '$namespace'..." -ForegroundColor Yellow
kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -

# 3. Apply manifests
Write-Host "🚀 Applying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml -n $namespace
kubectl apply -f k8s/secrets.yaml -n $namespace
kubectl apply -f k8s/api-deployment.yaml -n $namespace
kubectl apply -f k8s/worker-deployment.yaml -n $namespace
kubectl apply -f k8s/dashboard-deployment.yaml -n $namespace

# 4. Wait for deployment status
Write-Host "⏳ Waiting for pods rollout..." -ForegroundColor Yellow
kubectl rollout status deployment/recoverflow-api -n $namespace --timeout=120s
kubectl rollout status deployment/recoverflow-worker -n $namespace --timeout=120s
kubectl rollout status deployment/recoverflow-dashboard -n $namespace --timeout=120s

Write-Host "==================================================" -ForegroundColor Green
Write-Host "✅ All RecoverFlow deployments are healthy & ready!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
kubectl get pods,svc -n $namespace

Write-Host "`n👉 To access the services locally:" -ForegroundColor Cyan
Write-Host "   kubectl port-forward svc/recoverflow-api-service 8000:8000 -n $namespace"
Write-Host "   kubectl port-forward svc/recoverflow-dashboard-service 3000:80 -n $namespace"
