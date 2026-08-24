from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OperationsChecklistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: int
    venue_systems_ready: bool
    qr_checkpoints_ready: bool
    payment_hooks_ready: bool
    reminders_scheduled: bool
    readiness_score: float
    updated_at: datetime


class OperationsChecklistUpdate(BaseModel):
    venue_systems_ready: bool | None = None
    qr_checkpoints_ready: bool | None = None
    payment_hooks_ready: bool | None = None
    reminders_scheduled: bool | None = None
