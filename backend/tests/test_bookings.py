def _create_event(client, headers, total_tickets=5, base_price=20.0):
    r = client.post(
        "/events",
        headers=headers,
        json={
            "title": "Small Venue Show",
            "category": "music",
            "venue_city": "Austin",
            "venue_state": "TX",
            "base_price": base_price,
            "total_tickets": total_tickets,
        },
    )
    return r.json()["id"]


def test_create_booking_decrements_inventory(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=10)

    r = client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 3})
    assert r.status_code == 201
    body = r.json()
    assert body["quantity"] == 3
    assert body["price_paid"] == 60.0  # 3 * base_price(20.0)
    assert body["qr_code"].startswith("QR-")

    event = client.get(f"/events/{event_id}").json()
    assert event["tickets_sold"] == 3


def test_booking_rejected_when_insufficient_inventory(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=2)
    r = client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 5})
    assert r.status_code == 400


def test_booking_requires_auth(client, organizer_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.post("/bookings", json={"event_id": event_id, "quantity": 1})
    assert r.status_code == 401


def test_booking_missing_event_404(client, attendee_headers):
    r = client.post("/bookings", headers=attendee_headers, json={"event_id": 999999, "quantity": 1})
    assert r.status_code == 404


def test_my_bookings_lists_own_only(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 1})

    r = client.get("/bookings/me", headers=attendee_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.get("/bookings/me", headers=organizer_headers)
    assert r.status_code == 200
    assert len(r.json()) == 0
