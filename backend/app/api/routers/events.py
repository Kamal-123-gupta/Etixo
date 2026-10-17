from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.agents.event_creation_agent import generate_event_content
from app.agents.event_operations_agent import create_default_checklist
from app.api.deps import require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.event import Event, EventFAQ, EventTerm
from app.models.platform import AgentLog
from app.models.user import User
from app.schemas.event import EventCreate, EventDetailOut, EventOut
from app.schemas.generation import GeneratedContentOut, GenerateContentPreviewRequest

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    category: str | None = None,
    city: str | None = None,
    state: str | None = None,
    max_price: float | None = None,
    include_past: bool = False,
    limit: int = Query(default=50, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if category:
        q = q.filter(Event.category.ilike(category))
    if city:
        q = q.filter(Event.venue_city.ilike(city))
    if state:
        q = q.filter(Event.venue_state.ilike(state))
    if max_price is not None:
        q = q.filter(Event.current_price <= max_price)
    if not include_past:
        # Default: only events that haven't happened yet, or have no date
        # set at all (never treated as "past" -- there's nothing to compare
        # against). Events are never deleted when their date passes (see
        # Event.status) -- this only affects what shows up in the general
        # browse listing. Booking history and direct-by-id lookups
        # (GET /events/{id}) are completely unaffected by this filter, so a
        # past event a user actually booked is still fully viewable.
        now = datetime.now(timezone.utc)
        q = q.filter((Event.event_datetime.is_(None)) | (Event.event_datetime >= now))
    return q.order_by(Event.event_datetime.asc()).offset(offset).limit(limit).all()


@router.get("/{event_id}", response_model=EventDetailOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    current_user: User = Depends(require_role(UserRole.organizer, UserRole.admin)),
    db: Session = Depends(get_db),
):
    event = Event(
        organizer_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        subcategory=payload.subcategory,
        event_datetime=payload.event_datetime,
        venue_name=payload.venue_name,
        venue_city=payload.venue_city,
        venue_state=payload.venue_state,
        venue_country=payload.venue_country,
        base_price=payload.base_price,
        current_price=payload.base_price,
        total_tickets=payload.total_tickets,
        image_url=payload.image_url,
    )
    db.add(event)
    db.flush()
    db.add(create_default_checklist(event.id))
    db.commit()
    db.refresh(event)
    return event


@router.post("/generate-content", response_model=GeneratedContentOut)
def preview_generated_content(
    payload: GenerateContentPreviewRequest,
    current_user: User = Depends(require_role(UserRole.organizer, UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Preview AI-generated description/FAQs/terms before an event is
    created -- mirrors the frontend's generateAICopy() step in the Create
    Event form. Nothing is persisted here."""
    known_categories = [c for (c,) in db.query(Event.category).distinct()]
    content = generate_event_content(
        title=payload.title,
        category=payload.category,
        venue_city=payload.venue_city,
        venue_state=payload.venue_state,
        price=payload.base_price,
        known_categories=known_categories,
    )
    return GeneratedContentOut(
        description=content.description, faqs=content.faqs, terms=content.terms,
        source=content.source, warnings=content.warnings,
    )


@router.post("/{event_id}/generate-content", response_model=EventDetailOut)
def generate_and_apply_content(
    event_id: int,
    current_user: User = Depends(require_role(UserRole.organizer, UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Generates content for an existing event and persists it: sets
    event.description and replaces its FAQs/terms."""
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your event")

    known_categories = [c for (c,) in db.query(Event.category).distinct()]
    content = generate_event_content(
        title=event.title,
        category=event.category,
        venue_city=event.venue_city,
        venue_state=event.venue_state,
        price=event.current_price,
        known_categories=known_categories,
    )

    event.description = content.description
    db.query(EventFAQ).filter(EventFAQ.event_id == event.id).delete()
    db.query(EventTerm).filter(EventTerm.event_id == event.id).delete()
    for faq in content.faqs:
        db.add(EventFAQ(event_id=event.id, question=str(faq.get("question", "")), answer=str(faq.get("answer", ""))))
    for term in content.terms:
        db.add(EventTerm(event_id=event.id, term_text=str(term)))

    log_message = f"Generated description/FAQs/terms for '{event.title}' via {content.source}"
    if content.warnings:
        log_message += " -- WARNING: " + "; ".join(content.warnings)
    db.add(
        AgentLog(
            agent_name="event_creation_agent",
            action_type="content_generated",
            related_entity_id=event.id,
            message=log_message,
        )
    )
    db.commit()
    db.refresh(event)
    return event