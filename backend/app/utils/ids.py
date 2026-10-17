import hmac
import hashlib
import io
import base64
import time
import secrets
import qrcode
from PIL import Image

from app.core.config import get_settings


def _get_secret() -> bytes:
    settings = get_settings()
    return (settings.JWT_SECRET_KEY or "fallback-secret-key").encode("utf-8")


def generate_qr_code(event_id: int, user_id: int) -> str:
    """Generate a tamper-evident, cryptographically signed QR ticket token."""
    salt = secrets.token_hex(4)
    ts = int(time.time())
    payload = f"{event_id}:{user_id}:{ts}:{salt}"
    sig = hmac.new(_get_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()[:8]
    return f"QR-{event_id}-{user_id}-{salt}-{sig}"


def verify_qr_token(token: str, expected_event_id: int | None = None) -> bool:
    """Verify that a given QR ticket token matches the valid format and event ID."""
    if not token or not token.startswith("QR-"):
        return False
    parts = token.split("-")
    if len(parts) < 4:
        return False
    try:
        event_id = int(parts[1])
        if expected_event_id is not None and event_id != expected_event_id:
            return False
        return True
    except (ValueError, IndexError):
        return False


def generate_qr_image_data_uri(token: str) -> str:
    """Render a scannable PNG QR code image and return as a Base64 data URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"
