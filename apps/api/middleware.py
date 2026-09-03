import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from apps.api.metrics import http_requests_total, http_request_duration_seconds

logger = logging.getLogger(__name__)


from collections import defaultdict
from starlette.responses import JSONResponse
import redis
from services.streams.producer import get_redis_client

# Sliding window rate limiter for brute-force and DDoS protection
_RATE_LIMIT_BUCKETS = defaultdict(list)
RATE_LIMIT_RULES = {
    "/api/v1/auth/login": (30, 60),          # 30 requests / min
    "/api/v1/auth/email/otp": (15, 60),      # 15 requests / min
    "/api/v1/auth/whatsapp/otp": (15, 60),   # 15 requests / min
    "/webhooks/": (600, 60),                 # 600 requests / min (high webhook burst)
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Protects authentication and webhook ingestion from brute-force and flood attacks.
    Backed by Redis for multi-instance consistency, with graceful in-memory fallback.
    """
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        try:
            self.redis_client = get_redis_client()
        except Exception as e:
            logger.warning(f"Could not connect to Redis for RateLimitMiddleware: {e}")

    async def dispatch(self, request, call_next):
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        for prefix, (max_reqs, window_sec) in RATE_LIMIT_RULES.items():
            if path.startswith(prefix):
                key = f"rate_limit:{prefix}:{client_ip}"
                # 1. Primary: Redis atomic increment with expiration
                try:
                    if self.redis_client is not None:
                        current = self.redis_client.incr(key)
                        if current == 1:
                            self.redis_client.expire(key, window_sec)
                        if current > max_reqs:
                            logger.warning(f"Rate limit exceeded for {client_ip} on {path} ({current}/{max_reqs})")
                            return JSONResponse(
                                status_code=429,
                                content={"detail": "Too many requests. Rate limit exceeded."},
                                headers={"Retry-After": str(window_sec)}
                            )
                        break
                except Exception as redis_err:
                    logger.debug(f"Redis rate limiting unavailable, using fallback: {redis_err}")

                # 2. Resilient In-Memory Fallback if Redis is unreachable
                now = time.time()
                timestamps = [t for t in _RATE_LIMIT_BUCKETS[key] if now - t < window_sec]
                if len(timestamps) >= max_reqs:
                    logger.warning(f"In-memory rate limit exceeded for {client_ip} on {path} ({len(timestamps)}/{max_reqs})")
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Rate limit exceeded."},
                        headers={"Retry-After": str(window_sec)}
                    )
                timestamps.append(now)
                _RATE_LIMIT_BUCKETS[key] = timestamps
                break

        return await call_next(request)


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

        # Enterprise Security & Tracing Headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        logger.info(f"Request {request_id} completed: {response.status_code} ({duration:.4f}s)")
        return response