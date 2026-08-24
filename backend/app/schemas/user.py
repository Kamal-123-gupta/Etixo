from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.attendee
    home_city: str | None = None
    home_state: str | None = None
    home_country: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    home_city: str | None = None
    home_state: str | None = None
    home_country: str | None = None


class PreferenceUpdate(BaseModel):
    categories: list[str] = Field(default_factory=list)
    budget_max: float | None = None
    ticket_tier: str | None = None


class PreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    categories: list[str]
    budget_max: float | None = None
    ticket_tier: str | None = None

    @classmethod
    def from_model(cls, pref) -> "PreferenceOut":
        return cls(
            categories=pref.category_list,
            budget_max=pref.budget_max,
            ticket_tier=pref.ticket_tier,
        )
