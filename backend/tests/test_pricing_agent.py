from app.agents.pricing_agent import classify_demand, evaluate_price
from app.models.enums import DemandTier


def test_classify_demand_thresholds():
    assert classify_demand(0, 100) == DemandTier.low
    assert classify_demand(29, 100) == DemandTier.low
    assert classify_demand(30, 100) == DemandTier.medium
    assert classify_demand(60, 100) == DemandTier.high
    assert classify_demand(85, 100) == DemandTier.surge
    assert classify_demand(0, 0) == DemandTier.low  # no divide-by-zero


def test_evaluate_price_scales_with_tier():
    low = evaluate_price(100.0, 0, 100)
    medium = evaluate_price(100.0, 30, 100)
    surge = evaluate_price(100.0, 90, 100)
    assert low.new_price == 100.0
    assert medium.new_price > low.new_price
    assert surge.new_price > medium.new_price


def _create_event(client, headers, total_tickets=10, base_price=100.0):
    return client.post(
        "/events",
        headers=headers,
        json={"title": "Small Show", "category": "music", "venue_city": "Austin", "base_price": base_price, "total_tickets": total_tickets},
    ).json()["id"]


def test_booking_triggers_price_reevaluation(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=10, base_price=100.0)

    # 3/10 = 30% sold -> crosses into "medium" tier
    client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 3})

    event = client.get(f"/events/{event_id}").json()
    assert event["demand_tier"] == "medium"
    assert event["current_price"] > 100.0


def test_price_lock_is_honored_even_after_price_changes(client, organizer_headers, attendee_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=10, base_price=100.0)

    # second attendee locks the price while it's still $100
    client.post(
        "/auth/register",
        json={"name": "Second Attendee", "email": "second-attendee@test.com", "password": "password123", "role": "attendee"},
    )
    token = client.post("/auth/login", json={"email": "second-attendee@test.com", "password": "password123"}).json()["access_token"]
    second_headers = {"Authorization": f"Bearer {token}"}

    lock = client.post(f"/events/{event_id}/price-lock", headers=second_headers)
    assert lock.status_code == 200
    assert lock.json()["locked_price"] == 100.0

    # first attendee books enough to push the price up into "medium"
    client.post("/bookings", headers=attendee_headers, json={"event_id": event_id, "quantity": 3})
    event = client.get(f"/events/{event_id}").json()
    assert event["current_price"] > 100.0

    # second attendee's booking should still honor their locked $100 price
    r = client.post("/bookings", headers=second_headers, json={"event_id": event_id, "quantity": 1})
    assert r.status_code == 201
    assert r.json()["price_paid"] == 100.0


def test_admin_reevaluate_sweep(client, organizer_headers):
    event_id = _create_event(client, organizer_headers, total_tickets=10, base_price=100.0)

    r = client.post("/auth/register", json={"name": "Admin", "email": "admin@test.com", "password": "password123", "role": "admin"})
    token = client.post("/auth/login", json={"email": "admin@test.com", "password": "password123"}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/agents/pricing/reevaluate", headers=admin_headers)
    assert r.status_code == 200
    assert "events_changed" in r.json()
