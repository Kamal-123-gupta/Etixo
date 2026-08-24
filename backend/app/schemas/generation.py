from pydantic import BaseModel


class EventFAQGenerated(BaseModel):
    question: str
    answer: str


class GeneratedContentOut(BaseModel):
    description: str
    faqs: list[EventFAQGenerated]
    terms: list[str]
    source: str  # "llm" or "template"
    warnings: list[str] = []


class GenerateContentPreviewRequest(BaseModel):
    """For previewing generated copy before an event exists yet -- mirrors
    the frontend's generateAICopy() call during the Create Event form."""

    title: str
    category: str
    venue_city: str | None = None
    venue_state: str | None = None
    base_price: float = 0.0