# RecoverFlow Enterprise Monitoring Setup Guide

This guide details the steps to set up **Prometheus** metrics collection and **Grafana** visualization for RecoverFlow in production or local environments.

---

## 1. Architecture Overview

RecoverFlow exports native Prometheus metrics via the `/metrics` endpoint on the API service:

```text
[ Incoming Traffic ] ───► [ RecoverFlow API ]
                                │ (/metrics)
                                ▼
                         [ Prometheus Scraper ]
                                │
                                ▼
                         [ Grafana Dashboards ]
```

---

## 2. Deploying Prometheus & Grafana (Kubernetes / Helm)

### Step 2.1: Add Helm Repositories
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### Step 2.2: Deploy Prometheus Stack
```bash
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --set server.persistentVolume.enabled=true
```

### Step 2.3: Configure Prometheus Scrape Job
Create `prometheus-scrape-config.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-recoverflow-scrape
  namespace: monitoring
data:
  recoverflow.yaml: |
    - job_name: 'recoverflow-api'
      metrics_path: '/metrics'
      scrape_interval: 10s
      static_configs:
        - targets: ['recoverflow-api-service.recoverflow.svc.cluster.local:8000']
```

Apply and reload Prometheus:
```bash
kubectl apply -f prometheus-scrape-config.yaml
```

---

## 3. Importing RecoverFlow Grafana Dashboard

1. Deploy Grafana:
   ```bash
   helm install grafana grafana/grafana \
     --namespace monitoring \
     --set adminPassword="admin_strong_password"
   ```
2. Port-forward Grafana:
   ```bash
   kubectl port-forward svc/grafana 3001:80 -n monitoring
   ```
3. Open `http://localhost:3001` (User: `admin`, Password: `admin_strong_password`).
4. Navigate to **Dashboards ➔ New ➔ Import**.
5. Upload or paste the contents of [`monitoring/grafana_dashboard.json`](../monitoring/grafana_dashboard.json).
6. Select the Prometheus data source and click **Import**.

---

## 4. Key Metrics Tracked

| Metric Name | Type | Description |
| :--- | :--- | :--- |
| `http_requests_total` | Counter | Total HTTP requests by method, endpoint, and status code |
| `http_request_duration_seconds` | Histogram | Request latency (p50, p95, p99) |
| `webhook_events_total` | Counter | Ingested webhook events by type (`payment.failed`, etc.) |
| `celery_tasks_total` | Counter | Async task execution counts and status |
| `opportunity_recovery_rate` | Gauge | Percentage of recovered opportunities |
| `recovered_revenue_inr` | Gauge | Cumulative recovered monetary value in INR |
