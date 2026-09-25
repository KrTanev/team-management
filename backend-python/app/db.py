from collections.abc import Iterator
from contextvars import ContextVar

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app import config


class Base(DeclarativeBase):
    pass


# Counts SQL statements per request. Exposed as the `X-Query-Count` response
# header when BD_DEBUG_QUERIES=1 (always on in test mode) — the checks use it.
# A mutable box, so increments made in the threadpool (sync endpoints run there
# with a *copy* of the context) are still visible to the middleware.
query_count: ContextVar[list[int] | None] = ContextVar("query_count", default=None)


def make_engine(url: str) -> Engine:
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=connect_args)

    if url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_conn, _record):  # pragma: no cover - driver hook
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()

    @event.listens_for(engine, "before_cursor_execute")
    def _count(*_args, **_kwargs):
        box = query_count.get()
        if box is not None:
            box[0] += 1

    return engine


engine = make_engine(config.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
