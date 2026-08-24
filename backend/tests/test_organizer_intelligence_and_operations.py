def _create_event(client, headers, total_tickets=10, base_price=50.0):
    return client.post(
        "/events",
        headers=headers,
        json={"title": "Insight Show", "category": "music", "venue_city": "Austin", "base_price": base_price, "total_tickets": total_tickets},
    ).json()["id"]


def test_insights_include_velocity_and_recommendation(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=10)
    client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 2})

    r = client.get("/organizer/insights", headers=organizer_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["events"]) == 1
    ev = body["events"][0]
    assert "velocity_last_7_days" in ev
    assert ev["velocity_last_7_days"] == 2
    assert "recommendation" in ev
    assert isinstance(ev["recommendation"], str) and len(ev["recommendation"]) > 0


def test_stalled_event_gets_marketing_recommendation(client, organizer_headers):
    _create_event(client, organizer_headers, total_tickets=100)  # no bookings at all
    r = client.get("/organizer/insights", headers=organizer_headers)
    ev = r.json()["events"][0]
    assert ev["velocity_last_7_days"] == 0
    assert "marketing" in ev["recommendation"].lower() or "stalled" in ev["recommendation"].lower()


def test_operations_checklist_created_with_event(client, organizer_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.get(f"/organizer/events/{event_id}/operations", headers=organizer_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["qr_checkpoints_ready"] is True  # default: QR generation already works
    assert body["venue_systems_ready"] is False  # default: needs organizer confirmation
    assert 0 <= body["readiness_score"] <= 100


def test_operations_checklist_update_changes_readiness_score(client, organizer_headers):
    event_id = _create_event(client, organizer_headers)
    before = client.get(f"/organizer/events/{event_id}/operations", headers=organizer_headers).json()

    r = client.patch(
        f"/organizer/events/{event_id}/operations",
        headers=organizer_headers,
        json={"venue_systems_ready": True, "reminders_scheduled": True},
    )
    assert r.status_code == 200
    after = r.json()
    assert after["venue_systems_ready"] is True
    assert after["reminders_scheduled"] is True
    assert after["readiness_score"] > before["readiness_score"]


def test_operations_checklist_requires_ownership(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.get(f"/organizer/events/{event_id}/operations", headers=attendee_headers)
    assert r.status_code == 403
