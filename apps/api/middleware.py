import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from apps.api.metrics import http_requests_total, http_request_duration_seconds

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.time()
        logger.info(f"Request {request_id} started: {request.method} {request.url.path}")

        response = await call_next(request)
        duration = time.time() - start_time

        # Track Prometheus metrics
        endpoint = request.url.path
        http_requests_total.labels(
            method=request.method,
            endpoint=endpoint,
            status=str(response.status_code)
        ).inc()

        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)

        response.headers["X-Request-ID"] = request_id
        logger.info(f"Request {request_id} completed: {response.status_code} ({duration:.4f}s)")
        return response