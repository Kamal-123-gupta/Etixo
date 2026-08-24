"""
event_operations_agent.py — Event Operations Agent.

Direct execution (per the README): ensures an event is operationally
ready before it goes live. Two responsibilities currently implemented:

  1. Checklist/readiness: create_default_checklist() runs when an event is
     created (see events.py router); readiness_message() builds the
     human-readable status used in notifications/AgentLog entries when an
     organizer toggles a checklist item.
  2. QR activation: already logged directly in bookings.py at booking time
     (this agent's other README responsibility) -- not duplicated here.

Reminder scheduling ("planned" per the README) is represented by the
`reminders_scheduled` checklist flag but no actual reminder dispatch
exists yet -- there's no notification-delivery channel (email/SMS) wired
up in this backend to schedule against.
"""

from app.models.operations import OperationsChecklist


def create_default_checklist(event_id: int) -> OperationsChecklist:
    return OperationsChecklist(event_id=event_id)


def readiness_message(checklist: OperationsChecklist, event_title: str) -> str:
    return f"Operations readiness for '{event_title}' is now {checklist.readiness_score:.0f}%."
