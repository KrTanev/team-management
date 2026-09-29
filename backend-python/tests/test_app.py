from app.auth import hash_password, verify_password


def test_password_hash_roundtrip():
    stored = hash_password("s3cret-pass")
    assert stored.startswith("scrypt$")
    assert verify_password("s3cret-pass", stored)
    assert not verify_password("wrong", stored)


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_teams_include_members(client, alice):
    body = client.get("/teams", headers=alice).json()
    assert body["total"] == 3
    assert [m["userId"] for m in body["items"][0]["members"]] == [1, 2, 4]


def test_unknown_route_uses_error_envelope(client):
    r = client.get("/nope")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"
