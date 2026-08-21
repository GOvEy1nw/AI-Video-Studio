"""Atomic JSON persistence for the backend generation queue."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, cast
from threading import Lock

from state.generation_queue_types import GenerationQueueState


class GenerationQueueStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = Lock()
        self._last_revision = -1
        self._unsupported_schema = False

    def load(self) -> GenerationQueueState | None:
        if not self._path.exists():
            return None
        try:
            value = json.loads(self._path.read_text(encoding="utf-8"))
            if not isinstance(value, dict):
                raise ValueError("queue root must be an object")
            data = cast(dict[str, Any], value)
            if data.get("schemaVersion") != 1:
                self._unsupported_schema = True
                return None
            state = GenerationQueueState.from_dict(data)
            pending = set(state.pending_job_ids)
            if state.revision < 0 or len(pending) != len(state.pending_job_ids):
                raise ValueError("invalid queue revision or duplicate pending job")
            if pending != {job_id for job_id, job in state.jobs.items() if job.status == "queued"}:
                raise ValueError("pending jobs do not match queued jobs")
            if any(job.id != job_id or job.status not in {"queued", "running", "cancel_requested", "completed", "failed", "cancelled", "interrupted"} for job_id, job in state.jobs.items()):
                raise ValueError("invalid generation job record")
            running = {job_id for job_id, job in state.jobs.items() if job.status in {"running", "cancel_requested"}}
            if running != ({state.active_job_id} if state.active_job_id is not None else set()):
                raise ValueError("active job does not match running job")
            self._last_revision = state.revision
            return state
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            corrupt = self._path.with_name(f"{self._path.name}.corrupt")
            try:
                self._path.replace(corrupt)
            except OSError:
                pass
            return None

    def save(self, state: GenerationQueueState) -> None:
        payload = state.to_dict()
        revision = state.revision
        with self._lock:
            if self._unsupported_schema:
                raise OSError("generation queue uses a newer unsupported schema")
            if revision < self._last_revision:
                return
            self._path.parent.mkdir(parents=True, exist_ok=True)
            temporary = self._path.with_name(f".{self._path.name}.tmp")
            with temporary.open("w", encoding="utf-8") as stream:
                json.dump(payload, stream, separators=(",", ":"), ensure_ascii=False)
                stream.flush()
                os.fsync(stream.fileno())
            temporary.replace(self._path)
            self._last_revision = revision
