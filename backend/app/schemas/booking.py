from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingStatus


class BookingCreate(BaseModel):
    event_id: int
    quantity: int = Field(ge=1, le=50)
    # Simulated payment fields — not persisted, only used by the (future)
    # Fraud Detection Agent to screen the attempt before it's confirmed.
    cardholder_name: str | None = None
    card_number: str | None = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_id: int
    quantity: int
    price_paid: float
    qr_code: str | None = None
    status: BookingStatus
    created_at: datetime
