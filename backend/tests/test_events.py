def _create_event(client, headers, **overrides):
    payload = {
        "title": "Test Concert",
        "category": "music",
        "venue_city": "Austin",
        "venue_state": "TX",
        "base_price": 50.0,
        "total_tickets": 100,
    }
    payload.update(overrides)
    return client.post("/events", headers=headers, json=payload)


def test_organizer_can_create_event(client, organizer_headers):
    r = _create_event(client, organizer_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Test Concert"
    assert body["current_price"] == 50.0
    assert body["tickets_sold"] == 0


def test_attendee_cannot_create_event(client, attendee_headers):
    r = _create_event(client, attendee_headers)
    assert r.status_code == 403


def test_unauthenticated_cannot_create_event(client):
    r = client.post(
        "/events",
        json={"title": "X", "category": "music", "base_price": 10.0, "total_tickets": 10},
    )
    assert r.status_code == 401


def test_list_and_filter_events(client, organizer_headers):
    _create_event(client, organizer_headers, title="Rock Show", category="music", venue_city="Austin")
    _create_event(client, organizer_headers, title="Cup Final", category="football", venue_city="Dallas")

    assert len(client.get("/events").json()) == 2

    music_only = client.get("/events", params={"category": "music"}).json()
    assert len(music_only) == 1
    assert music_only[0]["title"] == "Rock Show"


def test_get_event_detail_includes_faqs_and_terms(client, organizer_headers):
    event_id = _create_event(client, organizer_headers).json()["id"]
    r = client.get(f"/events/{event_id}")
    assert r.status_code == 200
    assert r.json()["faqs"] == []
    assert r.json()["terms"] == []


def test_get_missing_event_404(client):
    assert client.get("/events/999999").status_code == 404
