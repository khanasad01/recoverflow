from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "recoverflow",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "aggregate-strategy-performance-every-hour": {
            "task": "services.worker.tasks.aggregate_strategy_performance",
            "schedule": 3600.0,
        },
        "auto-update-policy-weights-hourly": {
            "task": "services.worker.tasks.auto_update_policy",
            "schedule": 3600.0,
        },
        "reset-daily-resource-counters-midnight": {
            "task": "services.worker.tasks.reset_resource_counters",
            "schedule": crontab(hour=0, minute=0),
        },
    }
)


# Import tasks so they register with Celery
from services.worker import tasks  # noqa