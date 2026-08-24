from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class OperationsChecklist(Base):
    """One row per event, tracking the Event Operations Agent's
    readiness checklist -- venue systems, QR checkpoints, payment hooks,
    and reminder scheduling, per the root README's Operations tab. Created
    automatically alongside its Event (see events.py router)."""

    __tablename__ = "event_operations_checklists"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), unique=True)

    venue_systems_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    qr_checkpoints_ready: Mapped[bool] = mapped_column(Boolean, default=True)  # QR generation already works at booking time
    payment_hooks_ready: Mapped[bool] = mapped_column(Boolean, default=True)  # booking/payment flow already works
    reminders_scheduled: Mapped[bool] = mapped_column(Boolean, default=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    event: Mapped["Event"] = relationship()

    @property
    def readiness_score(self) -> float:
        fields = [
            self.venue_systems_ready,
            self.qr_checkpoints_ready,
            self.payment_hooks_ready,
            self.reminders_scheduled,
        ]
        return round(100 * sum(fields) / len(fields), 1)
