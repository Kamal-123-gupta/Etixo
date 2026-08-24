from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.attendee)

    home_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    home_state: Mapped[str | None] = mapped_column(String(60), nullable=True)
    home_country: Mapped[str | None] = mapped_column(String(60), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    preference: Mapped["Preference"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(back_populates="organizer")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")
    support_messages: Mapped[list["SupportMessage"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class Preference(Base):
    """Personalization vector's *declared* side — the source-of-truth for a
    user's explicit interests/budget. The learned behavioral vector (from
    PersonalizationAgent) is computed on the fly from `bookings`/interaction
    history rather than persisted here, to avoid two sources of truth."""

    __tablename__ = "preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    # Comma-separated category slugs, e.g. "basketball,football". Kept as a
    # simple string (not a JSON column) for maximum portability between
    # SQLite (dev) and Postgres (prod) without a migration-time type switch.
    categories: Mapped[str] = mapped_column(String(500), default="")
    budget_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    ticket_tier: Mapped[str | None] = mapped_column(String(30), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(back_populates="preference")

    @property
    def category_list(self) -> list[str]:
        return [c for c in self.categories.split(",") if c]
