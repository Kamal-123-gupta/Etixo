def test_preview_generated_content(client, organizer_headers):
    r = client.post(
        "/events/generate-content",
        headers=organizer_headers,
        json={"title": "Jazz Night", "category": "music", "venue_city": "Austin", "venue_state": "TX", "base_price": 40.0},
    )
    assert r.status_code == 200
    body = r.json()
    assert "Jazz Night" in body["description"]
    assert len(body["faqs"]) >= 1
    assert len(body["terms"]) >= 1
    assert body["source"] == "template"  # no LLM configured in tests


def test_preview_requires_organizer_role(client, attendee_headers):
    r = client.post(
        "/events/generate-content",
        headers=attendee_headers,
        json={"title": "Jazz Night", "category": "music", "base_price": 40.0},
    )
    assert r.status_code == 403


def test_generate_and_apply_persists_to_event(client, organizer_headers):
    event_id = client.post(
        "/events",
        headers=organizer_headers,
        json={"title": "Jazz Night", "category": "music", "venue_city": "Austin", "venue_state": "TX", "base_price": 40.0, "total_tickets": 50},
    ).json()["id"]

    r = client.post(f"/events/{event_id}/generate-content", headers=organizer_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["description"]
    assert len(body["faqs"]) >= 1
    assert len(body["terms"]) >= 1

    detail = client.get(f"/events/{event_id}").json()
    assert detail["description"] == body["description"]
    assert len(detail["faqs"]) == len(body["faqs"])


def test_generate_and_apply_requires_ownership(client, organizer_headers, attendee_headers):
    event_id = client.post(
        "/events",
        headers=organizer_headers,
        json={"title": "Jazz Night", "category": "music", "base_price": 40.0, "total_tickets": 50},
    ).json()["id"]

    r = client.post(f"/events/{event_id}/generate-content", headers=attendee_headers)
    assert r.status_code == 403
