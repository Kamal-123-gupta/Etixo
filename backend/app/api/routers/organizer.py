from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.agents.marketing_agent import generate_campaign
from app.agents.organizer_intelligence_agent import analyze_event
from app.api.deps import require_role
from app.db.session import get_db
from app.models.booking import Booking
from app.models.enums import CampaignStatus, UserRole
from app.models.event import Event
from app.models.operations import OperationsChecklist
from app.models.platform import AgentLog, Campaign, Notification
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignOut
from app.schemas.event import EventOut
from app.schemas.operations import OperationsChecklistOut, OperationsChecklistUpdate

router = APIRouter(prefix="/organizer", tags=["organizer"])

organizer_or_admin = require_role(UserRole.organizer, UserRole.admin)


def _get_owned_event(db: Session, event_id: int, current_user: User) -> Event:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not your event")
    return event


@router.get("/events", response_model=list[EventOut])
def my_events(current_user: User = Depends(organizer_or_admin), db: Session = Depends(get_db)):
    return db.query(Event).filter(Event.organizer_id == current_user.id).all()


@router.get("/insights")
def my_insights(current_user: User = Depends(organizer_or_admin), db: Session = Depends(get_db)):
    """Revenue, tickets sold, and per-event sales velocity + a rule-based
    recommendation from the Organizer Intelligence Agent."""
    events = db.query(Event).filter(Event.organizer_id == current_user.id).all()
    if not events:
        return {"total_revenue": 0.0, "total_tickets_sold": 0, "events": []}

    event_ids = [e.id for e in events]
    rows = (
        db.query(
            Booking.event_id,
            func.coalesce(func.sum(Booking.price_paid), 0.0).label("revenue"),
            func.coalesce(func.sum(Booking.quantity), 0).label("tickets_sold"),
        )
        .filter(Booking.event_id.in_(event_ids))
        .group_by(Booking.event_id)
        .all()
    )
    by_event = {r.event_id: {"revenue": r.revenue, "tickets_sold": r.tickets_sold} for r in rows}

    per_event = []
    for e in events:
        intelligence = analyze_event(db, e)
        per_event.append(
            {
                "event_id": e.id,
                "title": e.title,
                "revenue": by_event.get(e.id, {}).get("revenue", 0.0),
                "tickets_sold": by_event.get(e.id, {}).get("tickets_sold", 0),
                "total_tickets": e.total_tickets,
                "demand_tier": e.demand_tier.value,
                "velocity_last_7_days": intelligence.velocity_last_7_days,
                "recommendation": intelligence.recommendation,
            }
        )

    return {
        "total_revenue": sum(x["revenue"] for x in per_event),
        "total_tickets_sold": sum(x["tickets_sold"] for x in per_event),
        "events": per_event,
    }


@router.post("/events/{event_id}/campaigns", response_model=CampaignOut, status_code=201)
def launch_campaign(
    event_id: int,
    payload: CampaignCreate,
    current_user: User = Depends(organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = _get_owned_event(db, event_id, current_user)

    known_categories = [c for (c,) in db.query(Event.category).distinct()]
    generated = generate_campaign(
        channel=payload.channel.value,
        title=event.title,
        category=event.category,
        venue_city=event.venue_city,
        price=event.current_price,
        total_tickets=event.total_tickets,
        tickets_sold=event.tickets_sold,
        known_categories=known_categories,
    )

    campaign = Campaign(
        event_id=event.id,
        channel=payload.channel,
        status=CampaignStatus.sent,
        content=generated.content,
        sent_count=generated.sent_count,
        engagement_rate=generated.engagement_rate,
    )
    # `warnings` has no DB column -- it's a per-request signal, not
    # persisted state -- but setting it as a plain attribute here lets
    # CampaignOut (from_attributes=True) pick it up via normal attribute
    # access for THIS response, without needing a migration.
    campaign.warnings = generated.warnings
    db.add(campaign)
    log_message = (
        f"Launched {payload.channel.value} campaign for '{event.title}' via {generated.source} "
        f"(reach: {generated.sent_count}, engagement: {generated.engagement_rate:.1%})"
    )
    if generated.warnings:
        log_message += " -- WARNING: " + "; ".join(generated.warnings)
    db.add(
        AgentLog(
            agent_name="marketing_campaign_agent",
            action_type="campaign_launched",
            related_entity_id=event.id,
            message=log_message,
        )
    )
    db.add(
        Notification(
            user_id=current_user.id,
            message=f"{payload.channel.value.title()} campaign launched for '{event.title}'",
            type="campaign_launched",
        )
    )
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/events/{event_id}/campaigns", response_model=list[CampaignOut])
def list_campaigns(event_id: int, current_user: User = Depends(organizer_or_admin), db: Session = Depends(get_db)):
    _get_owned_event(db, event_id, current_user)
    return db.query(Campaign).filter(Campaign.event_id == event_id).order_by(Campaign.created_at.desc()).all()


@router.get("/events/{event_id}/operations", response_model=OperationsChecklistOut)
def get_operations_checklist(event_id: int, current_user: User = Depends(organizer_or_admin), db: Session = Depends(get_db)):
    event = _get_owned_event(db, event_id, current_user)
    checklist = db.query(OperationsChecklist).filter(OperationsChecklist.event_id == event.id).first()
    if checklist is None:
        raise HTTPException(status_code=404, detail="No operations checklist for this event")
    return checklist


@router.patch("/events/{event_id}/operations", response_model=OperationsChecklistOut)
def update_operations_checklist(
    event_id: int,
    payload: OperationsChecklistUpdate,
    current_user: User = Depends(organizer_or_admin),
    db: Session = Depends(get_db),
):
    from app.agents.event_operations_agent import readiness_message

    event = _get_owned_event(db, event_id, current_user)
    checklist = db.query(OperationsChecklist).filter(OperationsChecklist.event_id == event.id).first()
    if checklist is None:
        raise HTTPException(status_code=404, detail="No operations checklist for this event")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(checklist, field, value)

    if updates:
        db.add(
            AgentLog(
                agent_name="event_operations_agent",
                action_type="checklist_updated",
                related_entity_id=event.id,
                message=readiness_message(checklist, event.title),
            )
        )
        db.add(
            Notification(
                user_id=current_user.id,
                message=readiness_message(checklist, event.title),
                type="operations_update",
            )
        )

    db.commit()
    db.refresh(checklist)
    return checklist