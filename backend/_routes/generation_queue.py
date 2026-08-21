"""Thin HTTP adapters for the persistent generation queue."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends

from api_types import (
    GenerationQueueAcknowledgementRequest, GenerationQueueAdmission,
    GenerationQueueCancelResponse, GenerationQueueJobDetail,
    GenerationQueueOrderRequest, GenerationQueueSubmitRequest,
)
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api/generation", tags=["generation-queue"])
MAX_CLIENT_CONTEXT_BYTES = 256 * 1024


@router.post("/jobs", response_model=GenerationQueueAdmission, status_code=202)
def submit_job(req: GenerationQueueSubmitRequest, handler: AppHandler = Depends(get_state_service)) -> dict[str, object]:
    context = req.clientContext
    project_id = context.get("projectId")
    if context.get("schemaVersion") != 1 or not isinstance(project_id, str) or not project_id:
        from _routes._errors import HTTPError
        raise HTTPError(400, "INVALID_CLIENT_CONTEXT: clientContext requires schemaVersion 1 and projectId.")
    if len(json.dumps(context, ensure_ascii=False, separators=(",", ":")).encode("utf-8")) > MAX_CLIENT_CONTEXT_BYTES:
        from _routes._errors import HTTPError
        raise HTTPError(413, "CLIENT_CONTEXT_TOO_LARGE: clientContext exceeds 256 KiB.")
    return handler.generation_queue.submit(
        kind=req.job.kind,
        payload=req.job.payload.model_dump(mode="json"),
        client_request_id=req.clientRequestId,
        summary=req.summary.model_dump(mode="json"),
        client_context=context,
    )


@router.get("/queue")
def get_queue(handler: AppHandler = Depends(get_state_service)) -> dict[str, object]:
    return handler.generation_queue.snapshot()


@router.get("/jobs/{job_id}", response_model=GenerationQueueJobDetail)
def get_job(job_id: str, handler: AppHandler = Depends(get_state_service)) -> dict[str, object]:
    job = handler.generation_queue.get_job(job_id)
    return {"id": job.id, "kind": job.kind, "status": job.status, "summary": job.summary, "clientContext": job.client_context, "result": job.result, "error": job.error, "createdAt": job.created_at, "startedAt": job.started_at, "finishedAt": job.finished_at, "acknowledgedAt": job.acknowledged_at}


@router.put("/queue/order")
def reorder_queue(req: GenerationQueueOrderRequest, handler: AppHandler = Depends(get_state_service)) -> dict[str, object]:
    return handler.generation_queue.reorder(req.expectedRevision, req.jobIds)


@router.delete("/jobs/{job_id}")
def remove_job(job_id: str, handler: AppHandler = Depends(get_state_service)) -> dict[str, str]:
    handler.generation_queue.remove(job_id)
    return {"status": "cancelled", "id": job_id}


@router.post("/jobs/{job_id}/cancel", response_model=GenerationQueueCancelResponse)
def cancel_job(job_id: str, handler: AppHandler = Depends(get_state_service)) -> dict[str, str]:
    return handler.generation_queue.request_cancel(job_id)


@router.post("/jobs/{job_id}/acknowledge")
def acknowledge_job(job_id: str, req: GenerationQueueAcknowledgementRequest, handler: AppHandler = Depends(get_state_service)) -> dict[str, object]:
    return handler.generation_queue.acknowledge(job_id, req.model_dump(mode="json"))


@router.post("/jobs/{job_id}/dismiss")
def dismiss_job(job_id: str, handler: AppHandler = Depends(get_state_service)) -> dict[str, str]:
    handler.generation_queue.dismiss(job_id)
    return {"status": "dismissed", "id": job_id}


@router.post("/jobs/{job_id}/discard")
def discard_job(job_id: str, handler: AppHandler = Depends(get_state_service)) -> dict[str, str]:
    handler.generation_queue.discard(job_id)
    return {"status": "discarded", "id": job_id}
