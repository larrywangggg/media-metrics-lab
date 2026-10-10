from __future__ import annotations

import csv
import io
from typing import Any
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models import Job, Result
from app.services.fetchers import get_fetcher
from app.services.jobs import service as job_service

YOUTUBE_URL = "https://www.youtube.com/@creator/shorts/abc123"
TIKTOK_URL = "https://www.tiktok.com/@dancer/video/1"
INSTAGRAM_URL = "https://www.instagram.com/photog/p/xyz"


def _upload_csv(
    client: TestClient, rows: list[tuple[str, str]], filename: str = "links.csv"
) -> dict[str, Any]:
    body = "platform,url\n" + "".join(f"{platform},{url}\n" for platform, url in rows)
    resp = client.post("/jobs/upload", files={"file": (filename, body.encode(), "text/csv")})
    assert resp.status_code == 200, resp.text
    return resp.json()


def _results(db: Session, job_id: UUID) -> list[Result]:
    return list(db.scalars(select(Result).where(Result.job_id == job_id).order_by(Result.id)))


def test_upload_persists_job_and_only_valid_rows(client: TestClient, db: Session) -> None:
    payload = _upload_csv(
        client,
        [
            ("youtube", YOUTUBE_URL),
            ("tiktok", TIKTOK_URL),
            ("myspace", "https://myspace.com/x"),
            ("youtube", ""),
        ],
        filename="campaign.csv",
    )
    assert (payload["valid_rows"], payload["invalid_rows"]) == (2, 2)

    job = db.get(Job, UUID(payload["job_id"]))
    assert job is not None
    assert job.status == "queued"
    assert job.source_filename == "campaign.csv"
    assert (job.total_rows, job.processed_rows) == (2, 0)
    assert job.created_at is not None and job.updated_at is not None  # server defaults

    assert [(r.platform, r.url, r.status) for r in _results(db, job.id)] == [
        ("youtube", YOUTUBE_URL, "queued"),
        ("tiktok", TIKTOK_URL, "queued"),
    ]


def test_run_processes_every_row_and_completes_job(client: TestClient, db: Session) -> None:
    job_id = _upload_csv(
        client, [("youtube", YOUTUBE_URL), ("tiktok", TIKTOK_URL), ("instagram", INSTAGRAM_URL)]
    )["job_id"]

    resp = client.post(f"/jobs/{job_id}/run")
    # TestClient runs background tasks before returning, so processing has finished here.
    assert resp.status_code == 202, resp.text
    assert resp.json()["status"] == "running"

    job = db.get(Job, UUID(job_id))
    assert job is not None
    assert job.status == "completed"
    assert job.processed_rows == 3
    assert job.updated_at > job.created_at  # onupdate=func.now() fired on a later transaction

    youtube, tiktok, instagram = _results(db, job.id)
    assert youtube.status == "success"
    assert youtube.error_message is None
    assert youtube.channel == "@creator"
    assert (youtube.title, youtube.views, youtube.likes, youtube.comments) == (
        "Example YouTube Video",
        123456,
        7890,
        123,
    )
    assert youtube.published_at is not None and youtube.published_at.tzinfo is not None
    for row in (tiktok, instagram):
        assert row.status == "failed"
        assert row.error_message
        assert row.views is None


class _CrashingFetcher:
    """Succeeds on the first row, then raises the way a broken network client would."""

    def __init__(self) -> None:
        self.calls = 0

    def fetch(self, url: str) -> dict[str, Any]:
        self.calls += 1
        if self.calls > 1:
            raise RuntimeError("connection reset")
        return get_fetcher("youtube").fetch(url)


def test_crash_mid_job_marks_job_failed_and_keeps_committed_rows(
    client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    job_id = _upload_csv(client, [("youtube", f"{YOUTUBE_URL}?n={i}") for i in range(3)])["job_id"]
    fetcher = _CrashingFetcher()
    monkeypatch.setattr(job_service, "get_fetcher", lambda platform: fetcher)

    assert client.post(f"/jobs/{job_id}/run").status_code == 202

    job = db.get(Job, UUID(job_id))
    assert job is not None
    assert job.status == "failed"
    assert job.processed_rows == 1
    # Rows are committed one at a time, so work done before the crash survives the rollback.
    assert [r.status for r in _results(db, job.id)] == ["success", "queued", "queued"]


@pytest.mark.parametrize("status", ["running", "completed", "failed"])
def test_run_rejects_job_that_is_not_queued(
    client: TestClient, db: Session, status: str
) -> None:
    job_id = UUID(_upload_csv(client, [("youtube", YOUTUBE_URL)])["job_id"])
    job = db.get(Job, job_id)
    assert job is not None
    job.status = status
    db.commit()

    resp = client.post(f"/jobs/{job_id}/run")
    assert resp.status_code == 409, resp.text
    assert [r.status for r in _results(db, job_id)] == ["queued"]


@pytest.mark.parametrize(
    ("method", "suffix"),
    [("POST", "/run"), ("GET", ""), ("GET", "/results"), ("GET", "/export.csv")],
)
def test_unknown_job_returns_404(
    client: TestClient, auth_headers: dict[str, str], method: str, suffix: str
) -> None:
    resp = client.request(method, f"/jobs/{uuid4()}{suffix}", headers=auth_headers)
    assert resp.status_code == 404, resp.text


def test_results_endpoint_paginates_in_upload_order(client: TestClient) -> None:
    urls = [f"https://www.youtube.com/watch?v=video{i}" for i in range(5)]
    job_id = _upload_csv(client, [("youtube", url) for url in urls])["job_id"]

    resp = client.get(f"/jobs/{job_id}/results", params={"limit": 2, "offset": 2})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["job"]["id"] == job_id
    assert [item["url"] for item in body["items"]] == urls[2:4]


def test_list_jobs_returns_newest_first_with_paging(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    for name in ("first.csv", "second.csv", "third.csv"):
        _upload_csv(client, [("youtube", YOUTUBE_URL)], filename=name)

    page1 = client.get("/jobs", params={"limit": 2}, headers=auth_headers).json()
    assert page1["total"] == 3
    assert page1["has_more"] is True
    assert [j["filename"] for j in page1["items"]] == ["third.csv", "second.csv"]

    page2 = client.get("/jobs", params={"limit": 2, "offset": 2}, headers=auth_headers).json()
    assert page2["has_more"] is False
    assert [j["filename"] for j in page2["items"]] == ["first.csv"]


def test_export_csv_streams_completed_results(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    job_id = _upload_csv(client, [("youtube", YOUTUBE_URL), ("tiktok", TIKTOK_URL)])["job_id"]
    client.post(f"/jobs/{job_id}/run")

    resp = client.get(f"/jobs/{job_id}/export.csv", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"].startswith("text/csv")
    assert f"job_{job_id}_results.csv" in resp.headers["content-disposition"]
    assert resp.text.startswith("﻿")  # BOM so Excel opens it as UTF-8

    youtube, tiktok = csv.DictReader(io.StringIO(resp.text.removeprefix("﻿")))
    assert (youtube["url"], youtube["status"]) == (YOUTUBE_URL, "success")
    assert youtube["engagement_rate"] == f"{(7890 + 123) / 123456:.6f}"
    assert (tiktok["url"], tiktok["status"]) == (TIKTOK_URL, "failed")
    assert tiktok["engagement_rate"] == ""
    assert tiktok["error_message"]


def test_export_csv_rejects_job_that_has_not_completed(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    job_id = _upload_csv(client, [("youtube", YOUTUBE_URL)])["job_id"]

    resp = client.get(f"/jobs/{job_id}/export.csv", headers=auth_headers)
    assert resp.status_code == 409, resp.text


def test_deleting_job_cascades_to_results(client: TestClient, db: Session) -> None:
    job_id = UUID(_upload_csv(client, [("youtube", YOUTUBE_URL), ("tiktok", TIKTOK_URL)])["job_id"])

    # No ORM relationship exists, so this exercises the ON DELETE CASCADE on the foreign key.
    db.execute(delete(Job).where(Job.id == job_id))
    db.commit()

    assert db.scalar(select(func.count()).select_from(Result)) == 0
