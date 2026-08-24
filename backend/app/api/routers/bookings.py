from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.agents.fraud_agent import screen_booking
from app.agents.pricing_agent import evaluate_price, get_locked_price, lock_price
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.platform import AgentLog, FraudLog, Notification
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut
from app.utils.ids import generate_qr_code

router = APIRouter(tags=["bookings"])
bookings_router = APIRouter(prefix="/bookings", tags=["bookings"])


@bookings_router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.get(Event, payload.event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    remaining = event.total_tickets - event.tickets_sold
    if remaining < payload.quantity:
        raise HTTPException(status_code=400, detail=f"Only {remaining} tickets remaining")

    # --- Fraud Detection Agent: screen before confirming ---
    screening = screen_booking(payload.quantity, payload.cardholder_name, payload.card_number)
    if not screening.allowed:
        client_ip = request.client.host if request.client else None
        db.add(
            FraudLog(
                type=screening.fraud_type,
                severity=screening.severity,
                ip=client_ip,
                user_ref=current_user.id,
                event_id=event.id,
                details=screening.reason,
            )
        )
        db.add(
            AgentLog(
                agent_name="fraud_detection_agent",
                action_type="booking_blocked",
                related_entity_id=event.id,
                message=screening.reason or "Booking blocked by fraud detection",
            )
        )
        db.add(
            Notification(
                user_id=None,  # org-wide: surfaces on the Admin Dashboard's live fraud feed
                message=f"Fraud block: {screening.reason}",
                type="fraud_block",
            )
        )
        db.commit()
        raise HTTPException(status_code=403, detail=screening.reason)

    # --- Dynamic Pricing Agent: honor a locked quote if the attendee has one, else current price ---
    locked = get_locked_price(event.id, current_user.id)
    unit_price = locked if locked is not None else event.current_price
    price_paid = unit_price * payload.quantity

    booking = Booking(
        event_id=event.id,
        user_id=current_user.id,
        quantity=payload.quantity,
        price_paid=price_paid,
        qr_code=generate_qr_code(event.id, current_user.id),
    )
    event.tickets_sold += payload.quantity

    db.add(booking)
    db.add(
        AgentLog(
            agent_name="event_operations_agent",
            action_type="qr_activated",
            related_entity_id=event.id,
            message=f"QR ticket activated for booking by user {current_user.id} on event {event.id}",
        )
    )

    # --- Dynamic Pricing Agent: re-evaluate demand tier/price after this sale ---
    decision = evaluate_price(event.base_price, event.tickets_sold, event.total_tickets)
    if decision.demand_tier != event.demand_tier or decision.new_price != event.current_price:
        event.demand_tier = decision.demand_tier
        event.current_price = decision.new_price
        db.add(
            AgentLog(
                agent_name="pricing_agent",
                action_type="price_updated",
                related_entity_id=event.id,
                message=f"Re-priced '{event.title}' to ${decision.new_price:.2f} (demand: {decision.demand_tier.value})",
            )
        )

    db.commit()
    db.refresh(booking)
    return booking


@bookings_router.get("/me", response_model=list[BookingOut])
def my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.post("/events/{event_id}/price-lock")
def create_price_lock(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Locks the event's current price for this user for a short window,
    matching the frontend's price-lock countdown at checkout."""
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    expires_at = lock_price(event_id, current_user.id, event.current_price)
    return {"event_id": event_id, "locked_price": event.current_price, "expires_at": expires_at}
