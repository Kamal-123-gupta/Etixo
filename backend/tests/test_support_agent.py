def test_refund_intent(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "I want a refund"})
    assert r.status_code == 200
    body = r.json()
    assert body["intent"] == "refund"
    assert body["escalated"] is False


def test_qr_intent(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "where is my QR ticket"})
    assert r.json()["intent"] == "qr"


def test_pricing_intent(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "why did the price go up"})
    assert r.json()["intent"] == "pricing_explanation"


def test_fraud_intent(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "my booking was blocked"})
    assert r.json()["intent"] == "fraud_explanation"


def test_escalation(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "I want to escalate this"})
    body = r.json()
    assert body["escalated"] is True
    assert body["intent"] == "escalation"


def test_fallback_intent_without_llm_configured(client, attendee_headers):
    r = client.post("/support/messages", headers=attendee_headers, json={"message": "asdkjfh random gibberish query"})
    assert r.json()["intent"] == "fallback"


def test_messages_are_persisted(client, attendee_headers):
    client.post("/support/messages", headers=attendee_headers, json={"message": "I want a refund"})
    r = client.get("/support/messages/me", headers=attendee_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2  # user message + agent reply
