"""Logging policy tests for traceback ownership and duplication prevention."""

from __future__ import annotations

import logging
from pathlib import Path


def _policy_records(caplog, *, contains: str) -> list[logging.LogRecord]:
    return [record for record in caplog.records if record.name == "logging_policy" and contains in record.getMessage()]


def test_http_500_logs_single_traceback(caplog, client, enable_wangp) -> None:
    caplog.set_level(logging.WARNING)
    enable_wangp.raise_on_images = RuntimeError("GPU OOM")

    response = client.post("/api/generate-image", json={"prompt": "test"})

    assert response.status_code == 500
    records = _policy_records(caplog, contains="HTTP error on POST /api/generate-image: [500]")
    assert len(records) == 1
    assert records[0].exc_info is not None


def test_http_400_logs_without_traceback(caplog, client, enable_wangp) -> None:
    caplog.set_level(logging.WARNING)

    response = client.post(
        "/api/generate",
        json={
            "prompt": "test",
            "resolution": "540p",
            "model": "fast",
            "duration": "2",
            "fps": "24",
            "imagePath": "/no/such/file.png",
        },
    )

    assert response.status_code == 400
    records = _policy_records(caplog, contains="HTTP error on POST /api/generate: [400]")
    assert len(records) == 1
    assert records[0].exc_info is None


def test_unhandled_exception_logs_single_traceback(caplog, test_state, monkeypatch) -> None:
    caplog.set_level(logging.ERROR)

    def _raise_unhandled() -> None:
        raise RuntimeError("boom")

    monkeypatch.setattr(test_state.health, "get_health", _raise_unhandled)
    from starlette.testclient import TestClient
    from app_factory import create_app

    with TestClient(create_app(handler=test_state), raise_server_exceptions=False) as test_client:
        response = test_client.get("/health")

    assert response.status_code == 500
    records = _policy_records(caplog, contains="Unhandled error on GET /health")
    assert len(records) == 1
    assert records[0].exc_info is not None


def test_logger_exception_usage_is_restricted_to_boundaries() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    allowed = {Path("app_factory.py")}

    for path in backend_dir.rglob("*.py"):
        if "tests" in path.parts or ".venv" in path.parts:
            continue
        content = path.read_text(encoding="utf-8")
        if "logger.exception(" in content:
            rel_path = path.relative_to(backend_dir)
            assert rel_path in allowed, f"logger.exception usage is only allowed in boundary files: {rel_path}"
