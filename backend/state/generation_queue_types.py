"""Import-safe persisted generation queue records."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal, cast

QueueJobStatus = Literal[
    "queued", "running", "cancel_requested", "completed", "failed", "cancelled", "interrupted"
]
GenerationJobKind = Literal[
    "image.generate", "video.generate", "audio.music", "audio.sfx", "audio.speech",
    "media.upscale", "video.retake", "director.generate",
]
TERMINAL_STATUSES = frozenset({"completed", "failed", "cancelled", "interrupted"})


@dataclass
class GenerationQueueJob:
    id: str
    client_request_id: str
    kind: str
    payload: dict[str, Any]
    summary: dict[str, Any]
    client_context: dict[str, Any]
    status: QueueJobStatus = "queued"
    created_at: str = ""
    started_at: str | None = None
    finished_at: str | None = None
    cancel_requested_at: str | None = None
    acknowledged_at: str | None = None
    progress: dict[str, Any] | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
    requires_acknowledgement: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "GenerationQueueJob":
        return cls(**value)


@dataclass
class GenerationQueueState:
    schema_version: int = 1
    revision: int = 0
    active_job_id: str | None = None
    pending_job_ids: list[str] = field(default_factory=lambda: list[str]())
    jobs: dict[str, GenerationQueueJob] = field(default_factory=lambda: dict[str, GenerationQueueJob]())

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "revision": self.revision,
            "activeJobId": self.active_job_id,
            "pendingJobIds": list(self.pending_job_ids),
            "jobs": {job_id: job.to_dict() for job_id, job in self.jobs.items()},
        }

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "GenerationQueueState":
        jobs_value: object = value.get("jobs", {})
        if not isinstance(jobs_value, dict):
            raise ValueError("jobs must be an object")
        raw_jobs = cast(dict[object, object], jobs_value)
        pending_value: object = value.get("pendingJobIds", [])
        raw_pending = cast(list[object], pending_value) if isinstance(pending_value, list) else []
        pending_job_ids: list[str] = [str(job_id) for job_id in raw_pending]
        parsed_jobs: dict[str, GenerationQueueJob] = {}
        for job_id, job in raw_jobs.items():
            if not isinstance(job, dict):
                raise ValueError("job must be an object")
            parsed_jobs[str(job_id)] = GenerationQueueJob.from_dict(cast(dict[str, Any], job))
        return cls(
            schema_version=int(value.get("schemaVersion", 0)),
            revision=int(value.get("revision", 0)),
            active_job_id=value.get("activeJobId"),
            pending_job_ids=pending_job_ids,
            jobs=parsed_jobs,
        )
