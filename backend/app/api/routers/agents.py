from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.agents.discovery_agent import EventDiscoveryAgent
from app.agents.pricing_agent import evaluate_price
from app.api.deps import require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.event import Event
from app.models.platform import AgentLog
from app.models.user import User
from app.recommendation.model import ContentBasedRecommender
from app.services.agent_bridge import events_dataframe, interactions_dataframe, users_dataframe

router = APIRouter(prefix="/agents", tags=["agents"])

# Agents are rebuilt per-request from current DB state rather than cached at
# import time — the dataset here is small enough that this is cheap, and it
# guarantees results always reflect the latest bookings/events. Worth
# revisiting (e.g. a cache invalidated on write) once the catalog grows.


@router.get("/discovery/search")
def discovery_search(
    q: str = Query(..., min_length=1),
    user_id: int | None = None,
    top_n: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    events_df = events_dataframe(db)
    if events_df.empty:
        return {"parsed_intent": None, "results": []}

    agent = EventDiscoveryAgent(events=events_df)
    intent = agent.parse_intent(q)
    results = agent.search(q, user_id=user_id, top_n=top_n)

    db.add(
        AgentLog(
            agent_name="event_discovery_agent",
            action_type="search",
            related_entity_id=user_id,
            message=f"Query {q!r} -> {len(results)} result(s)",
        )
    )
    db.commit()

    return {
        "parsed_intent": {
            "category": intent.category,
            "location": intent.location,
            "max_price": intent.max_price,
            "keywords": intent.keywords,
        },
        "results": results.to_dict(orient="records"),
    }


@router.get("/recommendations")
def recommendations(
    user_id: int = Query(..., alias="userId"),
    top_n: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    """Matches the API contract named in the README:
    `GET /recommendations?userId=... -> ranked event list`."""
    events_df = events_dataframe(db)
    users_df = users_dataframe(db)
    interactions_df = interactions_dataframe(db)

    if events_df.empty or users_df.empty or user_id not in set(users_df["user_id"]):
        return {"results": []}

    recommender = ContentBasedRecommender(events=events_df, users=users_df, interactions=interactions_df)
    results = recommender.recommend(user_id=user_id, top_n=top_n)

    db.add(
        AgentLog(
            agent_name="personalization_agent",
            action_type="recommend",
            related_entity_id=user_id,
            message=f"Served {len(results)} recommendation(s) to user {user_id}",
        )
    )
    db.commit()

    return {"results": results.to_dict(orient="records")}


@router.post("/pricing/reevaluate")
def reevaluate_pricing(
    current_user: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Sweeps every event and re-applies the Dynamic Pricing Agent's rules --
    stands in for the frontend's setInterval price-tick, now server-side and
    triggerable on demand (or from an external scheduler) instead of a
    client-side timer."""
    changed = []
    for event in db.query(Event).all():
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
            changed.append({"event_id": event.id, "title": event.title, "new_price": decision.new_price, "demand_tier": decision.demand_tier.value})

    db.commit()
    return {"events_changed": len(changed), "changes": changed}
