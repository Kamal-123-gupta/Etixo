import secrets


def generate_qr_code(event_id: int, user_id: int) -> str:
    """Placeholder QR payload — a real implementation would render an actual
    QR image (e.g. via `qrcode`) keyed off this same token. Kept as a short
    opaque token for now so the booking flow and Event Operations Agent
    (QR activation) have something concrete to work with."""
    return f"QR-{event_id}-{user_id}-{secrets.token_hex(4)}"
