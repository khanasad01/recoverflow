from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY,
)
from fastapi import Response

# 1. HTTP Request Metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests received by RecoverFlow API",
    ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request execution latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# 2. Ingestion & Webhook Metrics
webhook_events_total = Counter(
    "webhook_events_total",
    "Total payment gateway webhook events received",
    ["event_type"]
)

# 3. Asynchronous Worker Metrics
celery_tasks_total = Counter(
    "celery_tasks_total",
    "Total Celery worker tasks processed",
    ["task_name", "status"]
)

# 4. Business Recovery Gauges
opportunity_recovery_rate = Gauge(
    "opportunity_recovery_rate",
    "Latest percentage of successfully recovered revenue opportunities"
)

recovered_revenue_inr = Gauge(
    "recovered_revenue_inr",
    "Total monetary amount recovered in INR"
)


def get_prometheus_metrics() -> Response:
    """Generate Prometheus formatted scrape output."""
    data = generate_latest(REGISTRY)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
