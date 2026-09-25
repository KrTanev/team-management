import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["BD_TEST_MODE"] = "1"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        assert c.post("/__test__/reset").status_code == 204
        yield c


@pytest.fixture()
def alice(client):
    r = client.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['token']}"}
