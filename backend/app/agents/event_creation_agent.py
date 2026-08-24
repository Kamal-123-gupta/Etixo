"""
event_creation_agent.py — Event Creation Assistant Agent.

Generates a description, FAQ list, and short T&Cs list from an event's
title/category/location/price. Tries the pluggable LLM client first (see
app/llm/client.py); falls back to a deterministic template generator with
no external configuration required, so this agent always returns usable
content -- matching the "LLM generation" approach named in the README,
with a working offline fallback since local dev/tests won't have an LLM
key configured.
"""

import json
from dataclasses import dataclass, field

from app.llm.client import LLMUnavailable, generate
from app.llm.validation import category_mentioned_correctly

SYSTEM_PROMPT = (
    "You are an event copywriter for a ticket booking platform. Given an "
    "event's title, category, location, and price, produce marketing copy. "
    "Respond with ONLY minified JSON, no markdown fences, no preamble, "
    'matching exactly this shape: {"description": string, '
    '"faqs": [{"question": string, "answer": string}], "terms": [string]}. '
    "Provide one paragraph for description, 4-6 FAQs, and 4-6 short terms."
)


@dataclass
class GeneratedEventContent:
    description: str
    faqs: list[dict] = field(default_factory=list)
    terms: list[str] = field(default_factory=list)
    source: str = "template"  # "llm" or "template"
    warnings: list[str] = field(default_factory=list)


def _template_fallback(
    title: str, category: str, venue_city: str | None, venue_state: str | None, price: float
) -> GeneratedEventContent:
    location = f"{venue_city}, {venue_state}" if venue_city and venue_state else (venue_city or "the venue")
    description = (
        f"Join us for {title}, a {category} event taking place at {location}. "
        f"Tickets start at ${price:.2f} -- secure yours before they sell out."
    )
    faqs = [
        {"question": "What time do doors open?", "answer": "Doors typically open one hour before the scheduled start time."},
        {"question": "Is parking available nearby?", "answer": f"Parking availability varies -- check with {location} directly for the latest details."},
        {"question": "Are tickets refundable?", "answer": "Refunds are available up to 48 hours before the event, subject to the organizer's cancellation policy."},
        {"question": "How do I get my ticket?", "answer": "A QR code ticket is generated automatically after checkout and is available on your bookings page."},
        {"question": "Is this event suitable for all ages?", "answer": "Please check the venue's posted guidelines for any age restrictions on this event."},
    ]
    terms = [
        "Tickets are non-transferable unless otherwise stated by the organizer.",
        "Entry requires a valid QR code ticket, digital or printed.",
        "The organizer reserves the right to refuse entry for policy violations.",
        f"This {category} event is subject to the venue's standard terms of service.",
        "Prices may increase as demand rises; the price shown at checkout is final.",
    ]
    return GeneratedEventContent(description=description, faqs=faqs, terms=terms, source="template")


def generate_event_content(
    title: str, category: str, venue_city: str | None, venue_state: str | None, price: float,
    known_categories: list[str] | None = None,
) -> GeneratedEventContent:
    location = f"{venue_city}, {venue_state}" if venue_city and venue_state else "TBD"
    prompt = f"Title: {title}\nCategory: {category}\nLocation: {location}\nPrice: ${price:.2f}"

    try:
        raw = generate(SYSTEM_PROMPT, prompt, max_tokens=1200)
        payload = json.loads(raw)
        result = GeneratedEventContent(
            description=str(payload["description"]),
            faqs=list(payload.get("faqs", [])),
            terms=list(payload.get("terms", [])),
            source="llm",
        )
    except (LLMUnavailable, json.JSONDecodeError, KeyError, TypeError):
        result = _template_fallback(title, category, venue_city, venue_state, price)

    # Consistency check: catches an LLM naming a DIFFERENT known category
    # than the one it was given (e.g. "basketball" for a hockey event) --
    # a real hallucination caught in testing with a local Ollama model.
    # Skipped (not an error) if the caller doesn't supply the category
    # vocabulary -- optional so this stays backward compatible.
    if known_categories:
        ok, msg = category_mentioned_correctly(result.description, category, known_categories)
        if not ok:
            result.warnings.append(msg)

    return result