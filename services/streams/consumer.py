import os
import logging
from typing import List, Dict, Any, Optional
import redis
from services.streams.producer import STREAM_NAME, get_redis_client

logger = logging.getLogger(__name__)


def consume_stream_events(
    stream_name: str = STREAM_NAME,
    last_id: str = "0-0",
    count: int = 10,
    block_ms: Optional[int] = 1000,
    redis_client: Optional[redis.Redis] = None
) -> List[Dict[str, Any]]:
    """
    Read messages from a Redis stream starting after last_id.
    Returns list of dicts: [{"id": msg_id, "data": fields}]
    """
    try:
        r = get_redis_client(redis_client)
        resp = r.xread({stream_name: last_id}, count=count, block=block_ms)
        messages = []
        if resp:
            for s_name, stream_msgs in resp:
                for msg_id, data in stream_msgs:
                    messages.append({"id": msg_id, "data": data})
        return messages
    except Exception as e:
        logger.warning(f"Error consuming from stream {stream_name}: {e}")
        return []
