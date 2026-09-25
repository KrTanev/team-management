"""Loads the datasets described in contracts/SEED.md.

The starter only has users and teams. When you add projects and tasks, extend
`load_small` and `load_large` so the rest of the seed loads too.
"""

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.db import Base
from app.models import Team, TeamMember, User

SEED_FILE = Path(__file__).resolve().parents[2] / "contracts" / "seed.json"

LARGE_USERS = 500
LARGE_TEAMS = 40


def _ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def reset(db: Session, size: str = "small") -> None:
    bind = db.get_bind()
    db.close()
    Base.metadata.drop_all(bind)
    Base.metadata.create_all(bind)
    load_small(db)
    if size == "large":
        load_large(db)
    db.commit()


def load_small(db: Session) -> None:
    seed = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    pw = hash_password(seed["password"])  # one hash reused — scrypt is slow on purpose
    db.execute(
        insert(User),
        [
            {
                "id": u["id"],
                "email": u["email"],
                "first_name": u["firstName"],
                "last_name": u["lastName"],
                "display_name": u["displayName"],
                "role": u["role"],
                "password_hash": pw,
                "created_at": _ts(u["createdAt"]),
                "updated_at": _ts(u["updatedAt"]),
            }
            for u in seed["users"]
        ],
    )
    db.execute(
        insert(Team),
        [
            {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "created_at": _ts(t["createdAt"]),
                "updated_at": _ts(t["updatedAt"]),
            }
            for t in seed["teams"]
        ],
    )
    db.execute(
        insert(TeamMember),
        [
            {"team_id": m["teamId"], "user_id": m["userId"], "role": m["role"]}
            for m in seed["teamMembers"]
        ],
    )
    db.flush()


def load_large(db: Session) -> None:
    seed = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    pw = hash_password(seed["password"])
    user_base = max(u["id"] for u in seed["users"])
    team_base = max(t["id"] for t in seed["teams"])
    now = _ts("2025-01-01T00:00:00Z")

    db.execute(
        insert(User),
        [
            {
                "id": user_base + n,
                "email": f"user{n}@example.com",
                "first_name": "User",
                "last_name": str(n),
                "display_name": f"User {n}",
                "role": "member",
                "password_hash": pw,
                "created_at": now,
                "updated_at": now,
            }
            for n in range(1, LARGE_USERS + 1)
        ],
    )
    db.execute(
        insert(Team),
        [
            {
                "id": team_base + n,
                "name": f"Team {n:03}",
                "description": "",
                "created_at": now,
                "updated_at": now,
            }
            for n in range(1, LARGE_TEAMS + 1)
        ],
    )
    members = []
    for n in range(1, LARGE_TEAMS + 1):
        users = [u for u in range(1, LARGE_USERS + 1) if u % LARGE_TEAMS == n % LARGE_TEAMS]
        for i, u in enumerate(users):
            members.append(
                {
                    "team_id": team_base + n,
                    "user_id": user_base + u,
                    "role": "lead" if i == 0 else "member",
                }
            )
    db.execute(insert(TeamMember), members)
    db.flush()
