import enum


class UserRole(str, enum.Enum):
    attendee = "attendee"
    organizer = "organizer"
    admin = "admin"


class DemandTier(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    surge = "surge"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    refunded = "refunded"


class CampaignChannel(str, enum.Enum):
    whatsapp = "whatsapp"
    email = "email"
    x = "x"


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    sent = "sent"


class FraudSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class MessageSender(str, enum.Enum):
    user = "user"
    agent = "agent"
    human_agent = "human_agent"
