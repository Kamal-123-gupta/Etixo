"""
marketing_agent.py — Marketing Campaign Agent.

Generates channel-specific promotional copy (LLM with template fallback,
same pattern as the Event Creation Assistant) and simulates a campaign
"send": a plausible sent_count and engagement_rate derived from remaining
inventory, so the Organizer Console's Marketing tab has real numbers.
Actually dispatching WhatsApp/Email/X messages is out of scope -- this is
"direct execution" only in the sense of writing a completed Campaign
record, matching how the frontend prototype already simulates it.
"""

import random
from dataclasses import dataclass, field

from app.llm.client import LLMUnavailable, generate
from app.llm.validation import category_mentioned_correctly

CHANNEL_INSTRUCTIONS = {
    "whatsapp": "a short, punchy WhatsApp broadcast message (under 300 characters), 1-2 emoji max",
    "email": "a marketing email with a 'Subject: ...' line followed by a 2-3 paragraph body",
    "x": "a tweet for X/Twitter (under 280 characters) with 1-2 relevant hashtags",
}

# Simulated reach as a fraction of remaining inventory, and a plausible
# engagement-rate range, roughly ordered by channel intimacy (WhatsApp/Email
# convert better than a public X post in this simulation).
CHANNEL_REACH_BASE = {"whatsapp": 0.35, "email": 0.55, "x": 0.20}
CHANNEL_ENGAGEMENT_RANGE = {"whatsapp": (0.12, 0.28), "email": (0.08, 0.22), "x": (0.03, 0.12)}

SYSTEM_PROMPT = (
    "You write concise, high-converting marketing copy for a live-events "
    "ticket booking platform. Respond with ONLY the requested copy -- no "
    "preamble, no markdown, no explanation."
)


@dataclass
class GeneratedCampaign:
    content: str
    sent_count: int
    engagement_rate: float
    source: str  # "llm" or "template"
    warnings: list[str] = field(default_factory=list)


def _template_copy(channel: str, title: str, category: str, venue_city: str | None, price: float) -> str:
    location = f" in {venue_city}" if venue_city else ""
    if channel == "whatsapp":
        return f"🎟️ {title} is happening{location}! Tickets from ${price:.0f}. Grab yours before they're gone!"
    if channel == "email":
        return (
            f"Subject: Don't miss {title}\n\n"
            f"Hi there,\n\n{title} is coming{location} and tickets are on sale now, starting at ${price:.0f}. "
            f"As a {category} event, it's worth clearing your calendar for.\n\n"
            "Book your spot today before prices rise with demand."
        )
    hashtag = category.title().replace(' ', '')
    post = f"🔥 {title}{location} — tickets from ${price:.0f}. #Events #{hashtag}"
    if len(post) > 280:
        # hard safety net -- the system prompt promises X's 280-char limit
        # to the LLM, so the template fallback has to actually guarantee it
        # too, not just usually happen to fit for today's dataset. (This
        # exact check existed before and was dropped in a rewrite -- caught
        # again here rather than left silently missing.)
        overflow = len(post) - 280 + 1
        title = title[: max(0, len(title) - overflow)].rstrip() + "…"
        post = f"🔥 {title}{location} — tickets from ${price:.0f}. #Events #{hashtag}"
    return post


def generate_campaign(
    channel: str,
    title: str,
    category: str,
    venue_city: str | None,
    price: float,
    total_tickets: int,
    tickets_sold: int,
    known_categories: list[str] | None = None,
) -> GeneratedCampaign:
    remaining = max(total_tickets - tickets_sold, 1)
    prompt = (
        f"Write {CHANNEL_INSTRUCTIONS[channel]} promoting this event:\n"
        f"Title: {title}\nCategory: {category}\nLocation: {venue_city or 'TBD'}\nPrice: ${price:.2f}"
    )
    try:
        content = generate(SYSTEM_PROMPT, prompt, max_tokens=400)
        source = "llm"
    except LLMUnavailable:
        content = _template_copy(channel, title, category, venue_city, price)
        source = "template"

    sent_count = max(int(remaining * CHANNEL_REACH_BASE[channel] * random.uniform(0.8, 1.2)), 1)
    lo, hi = CHANNEL_ENGAGEMENT_RANGE[channel]
    engagement_rate = round(random.uniform(lo, hi), 3)

    warnings = []
    if known_categories:
        ok, msg = category_mentioned_correctly(content, category, known_categories)
        if not ok:
            warnings.append(msg)

    return GeneratedCampaign(
        content=content, sent_count=sent_count, engagement_rate=engagement_rate,
        source=source, warnings=warnings,
    )