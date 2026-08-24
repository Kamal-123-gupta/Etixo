from app.agents.fraud_agent import screen_booking


def test_screen_booking_allows_normal_purchase():
    result = screen_booking(quantity=2, cardholder_name="Jane Doe", card_number="4000123412341234")
    assert result.allowed is True


def test_screen_booking_blocks_bulk_quantity():
    result = screen_booking(quantity=11, cardholder_name="Jane Doe", card_number=None)
    assert result.allowed is False
    assert result.fraud_type == "bulk_quantity"


def test_screen_booking_blocks_flagged_name():
    result = screen_booking(quantity=1, cardholder_name="Test User", card_number=None)
    assert result.allowed is False
    assert result.fraud_type == "flagged_cardholder_name"


def test_screen_booking_blocks_known_test_card():
    result = screen_booking(quantity=1, cardholder_name="Jane Doe", card_number="4242 4242 4242 4242")
    assert result.allowed is False
    assert result.fraud_type == "test_card_fingerprint"


def _create_event(client, headers, total_tickets=50):
    return client.post(
        "/events",
        headers=headers,
        json={"title": "Big Show", "category": "music", "venue_city": "Austin", "base_price": 50.0, "total_tickets": total_tickets},
    ).json()["id"]


def test_bulk_booking_is_blocked_end_to_end(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 15})
    assert r.status_code == 403
    assert "threshold" in r.json()["detail"]


def test_flagged_cardholder_name_is_blocked_end_to_end(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    r = client.post(
        "/bookings",
        headers=attendee_headers,
        json={"event_id": event_id, "quantity": 1, "cardholder_name": "Fraud Tester"},
    )
    assert r.status_code == 403


def test_blocked_booking_does_not_consume_inventory(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 20})
    event = client.get(f"/events/{event_id}").json()
    assert event["tickets_sold"] == 0


def test_blocked_booking_creates_fraud_log_visible_to_admin(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers)
    client.post(
        "/bookings",
        headers=attendee_headers,
        json={"event_id": event_id, "quantity": 1, "card_number": "4111111111111111"},
    )

    client.post("/auth/register", json={"name": "Admin", "email": "admin2@test.com", "password": "password123", "role": "admin"})
    token = client.post("/auth/login", json={"email": "admin2@test.com", "password": "password123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}

    r = client.get("/admin/fraud-logs", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["type"] == "test_card_fingerprint"
