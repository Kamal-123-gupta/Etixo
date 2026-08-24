from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import Preference, User
from app.schemas.user import PreferenceOut, PreferenceUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/preferences", response_model=PreferenceOut)
def get_my_preferences(current_user: User = Depends(get_current_user)):
    return PreferenceOut.from_model(current_user.preference)


@router.put("/me/preferences", response_model=PreferenceOut)
def update_my_preferences(
    payload: PreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = current_user.preference
    if pref is None:
        pref = Preference(user_id=current_user.id)
        db.add(pref)
    pref.categories = ",".join(payload.categories)
    pref.budget_max = payload.budget_max
    pref.ticket_tier = payload.ticket_tier
    db.commit()
    db.refresh(pref)
    return PreferenceOut.from_model(pref)
