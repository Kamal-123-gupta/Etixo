def _create_event(client, headers):
    return client.post(
        "/events",
        headers=headers,
        json={"title": "Cup Final", "category": "football", "venue_city": "Dallas", "base_price": 100.0, "total_tickets": 200},
    ).json()["id"]


def test_launch_campaign_creates_record(client, organizer_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.post(f"/organizer/events/{event_id}/campaigns", headers=organizer_headers, json={"channel": "whatsapp"})
    assert r.status_code == 201
    body = r.json()
    assert body["channel"] == "whatsapp"
    assert body["status"] == "sent"
    assert body["sent_count"] > 0
    assert 0 <= body["engagement_rate"] <= 1
    assert body["content"]


def test_list_campaigns_for_event(client, organizer_headers):
    event_id = _create_event(client, organizer_headers)
    client.post(f"/organizer/events/{event_id}/campaigns", headers=organizer_headers, json={"channel": "email"})
    client.post(f"/organizer/events/{event_id}/campaigns", headers=organizer_headers, json={"channel": "x"})

    r = client.get(f"/organizer/events/{event_id}/campaigns", headers=organizer_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_campaign_requires_organizer_role(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.post(f"/organizer/events/{event_id}/campaigns", headers=attendee_headers, json={"channel": "email"})
    assert r.status_code == 403


def test_campaign_requires_ownership(client, organizer_headers, attendee_headers):
    """A second organizer shouldn't be able to launch campaigns for events they don't own."""
    event_id = _create_event(client, organizer_headers)

    client.post(
        "/auth/register",
        json={"name": "Org Two", "email": "org2@test.com", "password": "password123", "role": "organizer"},
    )
    token = client.post("/auth/login", json={"email": "org2@test.com", "password": "password123"}).json()["access_token"]
    other_org_headers = {"Authorization": f"Bearer {token}"}

    r = client.post(f"/organizer/events/{event_id}/campaigns", headers=other_org_headers, json={"channel": "email"})
    assert r.status_code == 403
