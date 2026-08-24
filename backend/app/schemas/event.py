from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DemandTier


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str
    subcategory: str | None = None
    event_datetime: datetime | None = None
    venue_name: str | None = None
    venue_city: str | None = None
    venue_state: str | None = None
    venue_country: str | None = None
    base_price: float = 0.0
    total_tickets: int = 0
    image_url: str | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    category: str
    subcategory: str | None = None
    event_datetime: datetime | None = None
    venue_name: str | None = None
    venue_city: str | None = None
    venue_state: str | None = None
    base_price: float
    current_price: float
    total_tickets: int
    tickets_sold: int
    demand_tier: DemandTier
    image_url: str | None = None
    popularity_score: float | None = None
    primary_performer_name: str | None = None
    organizer_id: int | None = None


class EventFAQOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    question: str
    answer: str


class EventTermOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    term_text: str


class EventDetailOut(EventOut):
    faqs: list[EventFAQOut] = Field(default_factory=list)
    terms: list[EventTermOut] = Field(default_factory=list)
