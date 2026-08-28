from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import CampaignChannel, CampaignStatus


class CampaignCreate(BaseModel):
    channel: CampaignChannel


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    channel: CampaignChannel
    status: CampaignStatus
    content: str
    sent_count: int
    engagement_rate: float | None = None
    created_at: datetime
    warnings: list[str] | None = None
    source: str | None = None  # "llm" or "template" -- which path generated this copy