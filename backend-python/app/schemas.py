from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer
from pydantic.alias_generators import to_camel

UserRole = Literal["admin", "member"]
TeamRole = Literal["lead", "member"]


def _iso_utc(value: datetime) -> str:
    if value.tzinfo is None:  # SQLite drops the timezone; everything is stored as UTC
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


Timestamp = Annotated[datetime, PlainSerializer(_iso_utc, return_type=str)]


class ApiModel(BaseModel):
    """camelCase on the wire, snake_case in Python."""

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True, extra="forbid"
    )


class Page[T](ApiModel):
    items: list[T]
    total: int
    limit: int
    offset: int


# --- auth -------------------------------------------------------------------


class LoginIn(ApiModel):
    email: EmailStr
    password: str


class UserOut(ApiModel):
    id: int
    email: str
    first_name: str
    last_name: str
    display_name: str
    role: UserRole
    created_at: Timestamp
    updated_at: Timestamp


class LoginOut(ApiModel):
    token: str
    user: UserOut


# --- users ------------------------------------------------------------------


class UserCreate(ApiModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    display_name: str | None = Field(default=None, max_length=160)
    password: str = Field(min_length=8)
    role: UserRole = "member"


class UserUpdate(ApiModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    role: UserRole | None = None


# --- teams ------------------------------------------------------------------


class TeamMemberOut(ApiModel):
    user_id: int
    display_name: str
    role: TeamRole


class TeamOut(ApiModel):
    id: int
    name: str
    description: str
    members: list[TeamMemberOut]
    created_at: Timestamp
    updated_at: Timestamp


class TeamCreate(ApiModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)


class TeamUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class TeamMemberIn(ApiModel):
    user_id: int
    role: TeamRole = "member"
