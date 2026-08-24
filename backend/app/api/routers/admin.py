from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.booking import Booking
from app.models.enums import UserRole
from app.models.platform import FraudLog
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

admin_only = require_role(UserRole.admin)


@router.get("/stats")
def platform_stats(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Booking.price_paid), 0.0)).scalar() or 0.0
    total_purchases = db.query(func.count(Booking.id)).scalar() or 0
    active_fraud_warnings = db.query(func.count(FraudLog.id)).scalar() or 0

    return {
        "total_users": total_users,
        "gross_revenue": total_revenue,
        "total_purchases": total_purchases,
        "active_fraud_warnings": active_fraud_warnings,
    }


@router.get("/fraud-logs")
def fraud_logs(current_user: User = Depends(admin_only), db: Session = Depends(get_db)):
    rows = db.query(FraudLog).order_by(FraudLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "severity": r.severity.value,
            "ip": r.ip,
            "event_id": r.event_id,
            "details": r.details,
            "timestamp": r.timestamp,
        }
        for r in rows
    ]
