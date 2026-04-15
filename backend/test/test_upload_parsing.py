from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "validation"

# Register a test user once and obtain a token for authenticated requests.
_register_resp = client.post(
    "/auth/register",
    json={"username": "ci_test_user", "password": "ci_test_pass"},
)
# 201 on first run, 409 if the DB already has this user (re-runs) — both fine.
if _register_resp.status_code == 409:
    _login_resp = client.post(
        "/auth/login",
        json={"username": "ci_test_user", "password": "ci_test_pass"},
    )
    _TOKEN = _login_resp.json()["access_token"]
else:
    _TOKEN = _register_resp.json()["access_token"]

_AUTH_HEADERS = {"Authorization": f"Bearer {_TOKEN}"}


def _post_file(path: Path) -> dict[str, Any]:
    assert path.exists(), f"Fixture not found: {path}"
    with path.open("rb") as f:
        # field name must match your endpoint param: upload(file: UploadFile = File(...))
        files = {"file": (path.name, f, "application/octet-stream")}
        resp = client.post("/jobs/upload", files=files)
    assert resp.status_code == 200, resp.text
    return resp.json()


def _get_job(job_id: str) -> dict[str, Any]:
    resp = client.get(f"/jobs/{job_id}", headers=_AUTH_HEADERS)
    assert resp.status_code == 200, resp.text
    return resp.json()


def _assert_common_shape(payload: dict[str, Any]) -> None:
    # Response summary fields
    assert "job_id" in payload
    assert "filename" in payload
    assert "total_rows" in payload
    assert "valid_rows" in payload
    assert "invalid_rows" in payload
    assert "invalid_preview" in payload

    assert isinstance(payload["job_id"], str)
    assert isinstance(payload["filename"], str)
    assert isinstance(payload["total_rows"], int)
    assert isinstance(payload["valid_rows"], int)
    assert isinstance(payload["invalid_rows"], int)
    assert isinstance(payload["invalid_preview"], list)

    # Self-consistency
    assert payload["total_rows"] == payload["valid_rows"] + payload["invalid_rows"]
    assert len(payload["invalid_preview"]) <= payload["invalid_rows"]
    assert len(payload["invalid_preview"]) <= 20

    # invalid_preview row structure
    for row in payload["invalid_preview"]:
        assert "row_index" in row
        assert "error_messages" in row
        assert isinstance(row["row_index"], int)
        assert isinstance(row["error_messages"], list)


@pytest.mark.parametrize(
    "filename",
    ["valid_csv.csv", "valid_xlsx.xlsx"],
)
def test_upload_valid_files_returns_all_valid(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)
    assert payload["filename"] == filename

    assert payload["total_rows"] > 0
    assert payload["invalid_rows"] == 0
    assert payload["valid_rows"] == payload["total_rows"]
    assert payload["invalid_preview"] == []

    # DB schema consistency: jobs.source_filename should be persisted and queryable.
    job = _get_job(payload["job_id"])
    assert job["filename"] == filename


@pytest.mark.parametrize(
    "filename",
    ["invalid_csv.csv", "invalid_xlsx.xlsx"],
)
def test_upload_invalid_files_reports_errors(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)
    assert payload["filename"] == filename

    assert payload["total_rows"] > 0
    assert payload["valid_rows"] == 0
    assert payload["invalid_rows"] == payload["total_rows"]

    # Preview should contain validation messages for invalid rows.
    assert len(payload["invalid_preview"]) > 0
    for row in payload["invalid_preview"]:
        assert len(row["error_messages"]) >= 1

    job = _get_job(payload["job_id"])
    assert job["filename"] == filename


@pytest.mark.parametrize(
    "filename",
    ["mixed_csv.csv", "mixed_xlsx.xlsx"],
)
def test_upload_mixed_files_splits_valid_and_invalid(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)
    assert payload["filename"] == filename

    assert payload["total_rows"] > 0
    assert payload["valid_rows"] > 0
    assert payload["invalid_rows"] > 0

    assert len(payload["invalid_preview"]) > 0
    for row in payload["invalid_preview"]:
        assert len(row["error_messages"]) >= 1

    job = _get_job(payload["job_id"])
    assert job["filename"] == filename


def test_upload_rejects_non_csv_xlsx() -> None:
    # If you implemented file type validation, this should be 415 or 400.
    # If you didn’t, feel free to delete this test.
    dummy = FIXTURES_DIR / "dummy.txt"
    dummy.write_text("hello", encoding="utf-8")

    try:
        with dummy.open("rb") as f:
            files = {"file": (dummy.name, f, "text/plain")}
            resp = client.post("/jobs/upload", files=files)
        assert resp.status_code in (400, 415, 422), resp.text
    finally:
        dummy.unlink(missing_ok=True)
