def test_register_and_login(client):
    r = client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice@test.com", "password": "password123", "role": "attendee"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "alice@test.com"

    r = client.post("/auth/login", json={"email": "alice@test.com", "password": "password123"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_duplicate_email_rejected(client):
    payload = {"name": "Bob", "email": "bob@test.com", "password": "password123", "role": "attendee"}
    assert client.post("/auth/register", json=payload).status_code == 201
    assert client.post("/auth/register", json=payload).status_code == 400


def test_wrong_password_rejected(client):
    client.post(
        "/auth/register",
        json={"name": "Carl", "email": "carl@test.com", "password": "password123", "role": "attendee"},
    )
    r = client.post("/auth/login", json={"email": "carl@test.com", "password": "wrong-password"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/auth/me").status_code == 401


def test_me_returns_current_user(client, attendee_headers):
    r = client.get("/auth/me", headers=attendee_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "attendee-tester@test.com"
