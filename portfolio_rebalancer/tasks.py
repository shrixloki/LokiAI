import os
import asyncio
from typing import Any, Dict, Optional
from celery import shared_task
from celery.result import AsyncResult

from .celery_app import app
from .executor import RebalancerExecutor


@app.task(name="rebalancer.run", bind=True)
def run_rebalancer_task(self, wallet_address: str, user_id: Optional[str] = None, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Celery task to run the portfolio rebalancer.
    Returns a JSON-serializable result.
    """
    # Propagate env and parameters to the executor via environment variables
    if user_id:
        os.environ["USER_ID"] = user_id

    # Map selected parameters to environment variables if provided
    if parameters:
        for key, value in parameters.items():
            if value is None:
                continue
            os.environ[str(key).upper()] = str(value)

    async def _run() -> Dict[str, Any]:
        executor = RebalancerExecutor(wallet_address, user_id)
        try:
            result = await executor.run()
            return result
        finally:
            await executor.cleanup()

    # Run the async executor inside Celery sync task
    return asyncio.run(_run())
