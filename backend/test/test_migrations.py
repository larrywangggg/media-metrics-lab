from __future__ import annotations

from typing import Any, Callable, Iterator

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect

from app.db.base import Base
from app.db.session import engine

# Migration 61706cec9f1b created these columns as nullable, but the Job model declares
# them NOT NULL. Delete an entry here once a migration brings the schema in line.
KNOWN_DRIFT = {
    ("modify_nullable", "jobs", "total_rows"),
    ("modify_nullable", "jobs", "processed_rows"),
}


def _flatten(diffs: list[Any]) -> Iterator[tuple[Any, ...]]:
    for diff in diffs:
        if isinstance(diff, list):  # column-level changes are grouped in a nested list
            yield from diff
        else:
            yield diff


def _drift_key(diff: tuple[Any, ...]) -> tuple[Any, ...]:
    if diff[0].startswith("modify_"):
        _op, _schema, table, column, *_ = diff
        return (diff[0], table, column)
    return diff


def test_migrated_schema_matches_models(migrated_db: None) -> None:
    with engine.connect() as conn:
        ctx = MigrationContext.configure(
            conn, opts={"compare_type": True, "compare_server_default": True}
        )
        found = {_drift_key(d) for d in _flatten(compare_metadata(ctx, Base.metadata))}

    assert found - KNOWN_DRIFT == set(), "Models and migrations disagree; add a migration"
    assert KNOWN_DRIFT - found == set(), "Drift was fixed; remove it from KNOWN_DRIFT"


def test_migrations_downgrade_to_base_and_upgrade_again(
    migrated_db: None, run_alembic: Callable[..., None]
) -> None:
    run_alembic("downgrade", "base")
    assert set(inspect(engine).get_table_names()) == {"alembic_version"}

    run_alembic("upgrade", "head")
    engine.dispose()  # drop pooled connections that may have cached plans for the old tables
    assert set(inspect(engine).get_table_names()) >= {t.name for t in Base.metadata.sorted_tables}
