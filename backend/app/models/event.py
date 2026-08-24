from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import DemandTier


class Event(Base):
    """
    The platform's single events table. Serves two origins:
      - Organizer-created events (organizer_id set) — created via the
        Create Event flow, matches the README schema fields directly.
      - Imported catalog events (organizer_id NULL, external_id set) —
        bulk-loaded from the Kaggle dataset via scripts/seed_data.py so the
        Discovery/Personalization/Recommendation agents have realistic
        volume to work with out of the box.
    Extra feature columns (popularity_score, primary_performer_name, lat/lon)
    exist specifically to feed app.recommendation.features without requiring
    a second table or an ETL step at request time.
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, index=True)
    organizer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(60), index=True)
    subcategory: Mapped[str | None] = mapped_column(String(60), nullable=True)

    event_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    venue_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    venue_city: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    venue_state: Mapped[str | None] = mapped_column(String(60), index=True, nullable=True)
    venue_country: Mapped[str | None] = mapped_column(String(60), nullable=True)
    venue_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    venue_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    venue_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    base_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    total_tickets: Mapped[int] = mapped_column(Integer, default=0)
    tickets_sold: Mapped[int] = mapped_column(Integer, default=0)
    demand_tier: Mapped[DemandTier] = mapped_column(Enum(DemandTier), default=DemandTier.low)
    risk_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Recommendation-engine feature inputs
    popularity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    primary_performer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    organizer: Mapped["User"] = relationship(back_populates="events")
    faqs: Mapped[list["EventFAQ"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    terms: Mapped[list["EventTerm"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="event")
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class EventFAQ(Base):
    __tablename__ = "event_faqs"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(Text)

    event: Mapped["Event"] = relationship(back_populates="faqs")


class EventTerm(Base):
    __tablename__ = "event_terms"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    term_text: Mapped[str] = mapped_column(Text)

    event: Mapped["Event"] = relationship(back_populates="terms")
