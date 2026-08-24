def _create_event(client, headers, **overrides):
    payload = {
        "title": "Cowboys Watch Party",
        "category": "football",
        "venue_city": "Dallas",
        "venue_state": "TX",
        "base_price": 80.0,
        "total_tickets": 50,
    }
    payload.update(overrides)
    return client.post("/events", headers=headers, json=payload).json()["id"]


def test_discovery_search_parses_and_filters(client, organizer_headers):
    _create_event(client, organizer_headers, title="Cowboys Watch Party", category="football", venue_city="Dallas", base_price=80.0)
    _create_event(client, organizer_headers, title="Concert Night", category="music", venue_city="Austin", base_price=200.0)

    r = client.get("/agents/discovery/search", params={"q": "football in Dallas under 100"})
    assert r.status_code == 200
    body = r.json()
    assert body["parsed_intent"]["category"] == "football"
    assert body["parsed_intent"]["max_price"] == 100.0
    assert len(body["results"]) == 1
    assert body["results"][0]["name"] == "Cowboys Watch Party"


def test_discovery_search_no_matches(client, organizer_headers):
    _create_event(client, organizer_headers)
    r = client.get("/agents/discovery/search", params={"q": "hockey under 5"})
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_recommendations_for_unknown_user_returns_empty(client, organizer_headers):
    _create_event(client, organizer_headers)
    r = client.get("/agents/recommendations", params={"userId": 999999})
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_recommendations_respects_declared_budget(client, organizer_headers, attendee_headers):
    cheap_id = _create_event(client, organizer_headers, title="Cheap Seats", category="football", base_price=30.0)
    _create_event(client, organizer_headers, title="Expensive Suite", category="football", base_price=500.0)

    me = client.get("/auth/me", headers=attendee_headers).json()
    client.put("/users/me/preferences", headers=attendee_headers, json={"categories": ["football"], "budget_max": 50.0})

    r = client.get("/agents/recommendations", params={"userId": me["id"]})
    assert r.status_code == 200
    names = [x["name"] for x in r.json()["results"]]
    assert "Cheap Seats" in names
    assert "Expensive Suite" not in names
