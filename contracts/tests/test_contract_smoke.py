"""Contract smoke tests — run against ANY backend (Python or Node) over HTTP.

    BASE_URL=http://localhost:8000 uv run --with pytest --with httpx pytest contracts/tests

The server must run with BD_TEST_MODE=1. These cover the *shipped* happy paths
only, so they pass on the starter. BetterDev's hidden checks go much further.
"""

import os
import re

import httpx
import pytest

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
USER_KEYS = {"id", "email", "firstName", "lastName", "displayName", "role", "createdAt", "updatedAt"}


@pytest.fixture(scope="module")
def api():
    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        assert client.post("/__test__/reset").status_code == 204
        yield client


def login(api: httpx.Client, email: str) -> dict:
    r = api.post("/auth/login", json={"email": email, "password": "password123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def admin(api):
    return login(api, "alice@example.com")


@pytest.fixture(scope="module")
def bob(api):
    return login(api, "bob@example.com")


def assert_error(r: httpx.Response, status: int, code: str):
    assert r.status_code == status, r.text
    body = r.json()
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)


def test_health(api):
    assert api.get("/health").json() == {"status": "ok"}


def test_login_returns_token_and_user(api):
    r = api.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    body = r.json()
    assert set(body) == {"token", "user"}
    assert set(body["user"]) == USER_KEYS
    assert body["user"]["role"] == "admin"
    assert ISO.match(body["user"]["createdAt"])


def test_login_wrong_password(api):
    r = api.post("/auth/login", json={"email": "alice@example.com", "password": "nope-nope"})
    assert_error(r, 401, "unauthorized")


def test_me_requires_token(api):
    assert_error(api.get("/auth/me"), 401, "unauthorized")


def test_me(api, bob):
    assert api.get("/auth/me", headers=bob).json()["email"] == "bob@example.com"


def test_users_list_shape(api, bob):
    body = api.get("/users", headers=bob).json()
    assert set(body) == {"items", "total", "limit", "offset"}
    assert body["total"] == 6
    assert [u["id"] for u in body["items"]] == [1, 2, 3, 4, 5, 6]
    assert all(set(u) == USER_KEYS for u in body["items"])


def test_users_search(api, bob):
    body = api.get("/users", params={"search": "CAROL"}, headers=bob).json()
    assert [u["email"] for u in body["items"]] == ["carol@example.com"]


def test_get_user_and_404(api, bob):
    assert api.get("/users/3", headers=bob).json()["displayName"] == "Carol Nguyen"
    assert_error(api.get("/users/999", headers=bob), 404, "not_found")


def test_admin_creates_user(api, admin):
    r = api.post(
        "/users",
        headers=admin,
        json={
            "email": "gina@example.com",
            "firstName": "Gina",
            "lastName": "Lopez",
            "password": "correct-horse",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["displayName"] == "Gina Lopez"
    assert r.json()["role"] == "member"
    assert "password" not in r.text.lower()
    again = api.post(
        "/users",
        headers=admin,
        json={"email": "gina@example.com", "firstName": "G", "lastName": "L", "password": "12345678"},
    )
    assert_error(again, 409, "conflict")


def test_validation_error_envelope(api, admin):
    r = api.post("/users", headers=admin, json={"email": "not-an-email"})
    assert_error(r, 422, "validation_error")
    fields = {d["field"] for d in r.json()["error"]["details"]}
    assert {"email", "firstName", "lastName", "password"} <= fields


def test_update_own_profile(api, bob):
    r = api.patch("/users/2", headers=bob, json={"displayName": "Bobby"})
    assert r.status_code == 200 and r.json()["displayName"] == "Bobby"
    assert_error(api.patch("/users/3", headers=bob, json={"displayName": "x"}), 403, "forbidden")


def test_teams_list(api, bob):
    body = api.get("/teams", headers=bob).json()
    assert body["total"] == 3
    marvin = body["items"][0]
    assert set(marvin) == {"id", "name", "description", "members", "createdAt", "updatedAt"}
    assert marvin["members"] == [
        {"userId": 1, "displayName": "Alice Johnson", "role": "lead"},
        {"userId": 2, "displayName": "Bobby", "role": "member"},
        {"userId": 4, "displayName": "Dave Petrov", "role": "member"},
    ]


def test_team_crud_and_members(api, admin, bob):
    r = api.post("/teams", headers=admin, json={"name": "Team Zeta"})
    assert r.status_code == 201, r.text
    team_id = r.json()["id"]
    assert_error(api.post("/teams", headers=bob, json={"name": "Nope"}), 403, "forbidden")

    r = api.post(f"/teams/{team_id}/members", headers=admin, json={"userId": 2, "role": "lead"})
    assert r.status_code == 201
    assert r.json()["members"] == [{"userId": 2, "displayName": "Bobby", "role": "lead"}]

    # bob is now lead → may edit
    r = api.patch(f"/teams/{team_id}", headers=bob, json={"description": "Zeta team"})
    assert r.status_code == 200 and r.json()["description"] == "Zeta team"

    assert api.delete(f"/teams/{team_id}/members/2", headers=admin).status_code == 204
    assert api.delete(f"/teams/{team_id}", headers=admin).status_code == 204


def test_query_count_header(api, bob):
    r = api.get("/users", headers=bob)
    assert int(r.headers["X-Query-Count"]) >= 1
