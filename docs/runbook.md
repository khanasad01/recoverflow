# RecoverFlow Production Operations Runbook

**Service Tier:** Tier 1 (Mission-Critical Payment Recovery Engine)  
**SLAs:** API p95 Latency < 500ms | Webhook Ingestion Availability > 99.95%

---

## 1. Routine Operational Commands

### 1.1 Docker Compose Environment
- **Start all services:**
  ```powershell
  docker compose up -d
  ```
- **Check container health & logs:**
  ```powershell
  docker compose ps
  docker compose logs -f api worker
  ```
- **Run automated test suite:**
  ```powershell
  docker compose exec api pytest tests/ -v
  ```

### 1.2 Kubernetes Cluster Management
- **Apply / Rollout configuration changes:**
  ```bash
  kubectl apply -f k8s/ -n recoverflow
  kubectl rollout status deployment/recoverflow-api -n recoverflow
  ```
- **Scale Celery Workers under heavy recovery surge:**
  ```bash
  kubectl scale deployment/recoverflow-worker --replicas=5 -n recoverflow
  ```

---

## 2. Disaster Recovery & Emergency Procedures

### 2.1 Database Failure / Connection Loss
1. Check PostgreSQL health:
   ```bash
   kubectl get pods -l app=postgres -n recoverflow
   ```
2. Verify connection string in `k8s/configmap.yaml`.
3. Restart API pods: `kubectl rollout restart deployment/recoverflow-api -n recoverflow`.

### 2.2 Webhook Signature Mismatch Errors
1. If Razorpay rotates its webhook secret:
   - Update `k8s/secrets.yaml` with the new `RAZORPAY_WEBHOOK_SECRET`.
   - Re-apply secret: `kubectl apply -f k8s/secrets.yaml -n recoverflow`.
   - Restart API pods to load new secret into runtime environment.

### 2.3 Redis Queue Backlog
1. Check queue size via Redis CLI:
   ```bash
   redis-cli -u redis://localhost:6379/0 LLEN celery
   ```
2. If backlog exceeds 1,000 tasks, scale worker replicas:
   ```bash
   docker compose up -d --scale worker=3
   ```
