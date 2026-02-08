from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "upload"


def _post_file(path: Path) -> dict[str, Any]:
    assert path.exists(), f"Fixture not found: {path}"
    with path.open("rb") as f:
        # field name must match your endpoint param: upload(file: UploadFile = File(...))
        files = {"file": (path.name, f, "application/octet-stream")}
        resp = client.post("/jobs/upload", files=files)
    assert resp.status_code == 200, resp.text
    return resp.json()


def _assert_common_shape(payload: dict[str, Any]) -> None:
    # Summary fields
    assert "total_rows" in payload
    assert "valid_rows" in payload
    assert "invalid_rows" in payload
    assert "rows" in payload

    assert isinstance(payload["total_rows"], int)
    assert isinstance(payload["valid_rows"], int)
    assert isinstance(payload["invalid_rows"], int)
    assert isinstance(payload["rows"], list)

    # Self-consistency
    assert payload["total_rows"] == payload["valid_rows"] + payload["invalid_rows"]
    assert payload["total_rows"] == len(payload["rows"])

    # Per-row structure
    for row in payload["rows"]:
        assert "row_index" in row
        assert "platform" in row
        assert "url" in row
        assert isinstance(row["row_index"], int)


@pytest.mark.parametrize(
    "filename",
    ["valid_csv.csv", "valid_xlsx.xlsx"],
)
def test_upload_valid_files_returns_all_valid(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)

    assert payload["total_rows"] > 0
    assert payload["invalid_rows"] == 0
    assert payload["valid_rows"] == payload["total_rows"]

    # Valid rows should have platform/url and should NOT report errors
    for row in payload["rows"]:
        assert row["platform"] in {"youtube", "tiktok", "instagram"}
        assert isinstance(row["url"], str)
        assert row["url"].strip() != ""

        # Allow either missing error_messages or empty list
        if "error_messages" in row:
            assert row["error_messages"] == []


@pytest.mark.parametrize(
    "filename",
    ["invalid_csv.csv", "invalid_xlsx.xlsx"],
)
def test_upload_invalid_files_reports_errors(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)

    assert payload["total_rows"] > 0
    assert payload["valid_rows"] == 0
    assert payload["invalid_rows"] == payload["total_rows"]

    # Every row should include error_messages with at least one message
    for row in payload["rows"]:
        assert "error_messages" in row
        assert isinstance(row["error_messages"], list)
        assert len(row["error_messages"]) >= 1


@pytest.mark.parametrize(
    "filename",
    ["mixed_csv.csv", "mixed_xlsx.xlsx"],
)
def test_upload_mixed_files_splits_valid_and_invalid(filename: str) -> None:
    payload = _post_file(FIXTURES_DIR / filename)
    _assert_common_shape(payload)

    assert payload["total_rows"] > 0
    assert payload["valid_rows"] > 0
    assert payload["invalid_rows"] > 0

    invalid_rows = [r for r in payload["rows"] if r.get("error_messages")]
    valid_rows = [r for r in payload["rows"] if not r.get("error_messages")]

    # Ensure we actually see both kinds in per-row results
    assert len(invalid_rows) == payload["invalid_rows"]
    assert len(valid_rows) == payload["valid_rows"]


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
