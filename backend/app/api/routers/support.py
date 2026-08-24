from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.support_agent import handle_message
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import MessageSender
from app.models.platform import SupportMessage
from app.models.user import User

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/messages")
def send_message(body: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = str(body.get("message", "")).strip()

    db.add(SupportMessage(user_id=current_user.id, sender=MessageSender.user, message=text))

    result = handle_message(db, current_user, text)
    sender = MessageSender.human_agent if result.escalated else MessageSender.agent
    agent_msg = SupportMessage(
        user_id=current_user.id, sender=sender, message=result.reply, escalated=result.escalated
    )
    db.add(agent_msg)
    db.commit()
    db.refresh(agent_msg)

    return {"reply": result.reply, "escalated": result.escalated, "intent": result.intent}


@router.get("/messages/me")
def my_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(SupportMessage)
        .filter(SupportMessage.user_id == current_user.id)
        .order_by(SupportMessage.timestamp.asc())
        .all()
    )
    return [
        {"sender": r.sender.value, "message": r.message, "escalated": r.escalated, "timestamp": r.timestamp}
        for r in rows
    ]
