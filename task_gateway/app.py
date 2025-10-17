import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from celery import Celery
from celery.result import AsyncResult

app = FastAPI(title="LokiAI Task Gateway", version="1.0")

BROKER_URL = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://redis:6379/0"))
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://redis:6379/1"))

celery_app = Celery("task_gateway", broker=BROKER_URL, backend=RESULT_BACKEND)


class RebalanceRequest(BaseModel):
    walletAddress: str
    userId: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


@app.get("/health")
def health():
    return {"status": "ok", "broker": BROKER_URL}


@app.post("/tasks/rebalancer")
def enqueue_rebalancer(req: RebalanceRequest):
    try:
        # Send task by name to avoid coupling gateway to agent code
        result = celery_app.send_task(
            "rebalancer.run",
            args=[req.walletAddress],
            kwargs={"user_id": req.userId, "parameters": req.parameters or {}},
            queue="rebalancer",
        )
        return {"success": True, "taskId": result.id, "state": result.state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    try:
        ar = AsyncResult(task_id, app=celery_app)
        response: Dict[str, Any] = {
            "taskId": task_id,
            "state": ar.state,
            "ready": ar.ready(),
            "successful": ar.successful(),
        }
        if ar.ready():
            try:
                response["result"] = ar.get(timeout=1)
            except Exception as e:  # pragma: no cover
                response["error"] = str(e)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
