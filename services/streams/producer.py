import os
import time
import json
import logging
from typing import Optional, Dict, Any
import redis

logger = logging.getLogger(__name__)

STREAM_NAME = "recoverflow_events"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def get_redis_client(client: Optional[redis.Redis] = None) -> redis.Redis:
    if client is not None:
        return client
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


def publish_raw_event(
    event_id: str,
    event_type: str,
    payload: str,
    redis_client: Optional[redis.Redis] = None
) -> Optional[str]:
    """
    Publish an incoming payment event to the Redis Stream for high-throughput
    event-driven decoupling.
    """
    try:
        r = get_redis_client(redis_client)
        entry = {
            "event_id": event_id,
            "event_type": event_type,
            "payload": payload if isinstance(payload, str) else json.dumps(payload),
            "timestamp": str(time.time())
        }
        stream_id = r.xadd(STREAM_NAME, entry)
        logger.info(f"Published event {event_id} to Redis Stream '{STREAM_NAME}' with ID {stream_id}")
        return str(stream_id)
    except Exception as e:
        logger.warning(f"Failed to publish event {event_id} to Redis Stream: {e}")
        return None
