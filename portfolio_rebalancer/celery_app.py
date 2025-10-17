import os
from celery import Celery

# Celery configuration
BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://redis:6379/0"))
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://redis:6379/1"))

app = Celery(
    "portfolio_rebalancer",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
)

# Optional Celery config
app.conf.update(
    task_queues={
        # default queue for rebalancer tasks
        "rebalancer": {
            "exchange": "rebalancer",
            "routing_key": "rebalancer",
        }
    },
    task_default_queue="rebalancer",
    task_track_started=True,
    result_expires=3600,
)
