from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.db.models import User


def _register(client: TestClient, username: str, password: str = "secret123"):
    return client.post("/auth/register", json={"username": username, "password": password})


def test_register_persists_user_with_bcrypt_hash(client: TestClient, db: Session) -> None:
    resp = _register(client, "  alice  ", "secret123")
    assert resp.status_code == 201, resp.text
    assert resp.json()["token_type"] == "bearer"

    user = db.scalars(select(User)).one()
    assert user.username == "alice"  # whitespace stripped before insert
    assert user.hashed_password != "secret123"
    assert user.hashed_password.startswith("$2b$")
    assert verify_password("secret123", user.hashed_password)
    assert user.created_at is not None  # server_default now()


def test_register_duplicate_username_returns_409(client: TestClient, db: Session) -> None:
    assert _register(client, "alice").status_code == 201

    resp = _register(client, "alice", "another-password")
    assert resp.status_code == 409, resp.text

    assert db.scalar(select(func.count()).select_from(User)) == 1


def test_username_uniqueness_is_enforced_by_database(db: Session) -> None:
    # The API checks for duplicates first, but two concurrent registrations can both
    # pass that check; the unique index is what actually guarantees uniqueness.
    db.add(User(username="alice", hashed_password="x"))
    db.commit()

    db.add(User(username="alice", hashed_password="y"))
    with pytest.raises(IntegrityError):
        db.commit()


@pytest.mark.parametrize(
    ("username", "password", "expected_status"),
    [
        ("alice", "secret123", 200),
        ("alice", "wrong-password", 401),
        ("nobody", "secret123", 401),
    ],
)
def test_login(
    client: TestClient, username: str, password: str, expected_status: int
) -> None:
    assert _register(client, "alice", "secret123").status_code == 201

    resp = client.post("/auth/login", json={"username": username, "password": password})
    assert resp.status_code == expected_status, resp.text
    if expected_status == 200:
        assert resp.json()["access_token"]


def test_login_token_grants_access_to_protected_route(client: TestClient) -> None:
    _register(client, "alice", "secret123")
    token = client.post(
        "/auth/login", json={"username": "alice", "password": "secret123"}
    ).json()["access_token"]

    assert client.get("/jobs", headers={"Authorization": f"Bearer {token}"}).status_code == 200


@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer not-a-real-token"}],
    ids=["missing", "invalid"],
)
def test_protected_route_rejects_bad_token(client: TestClient, headers: dict[str, str]) -> None:
    assert client.get("/jobs", headers=headers).status_code == 401
