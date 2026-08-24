
import json
import os
from abc import ABC, abstractmethod


class LLMClient(ABC):
    @abstractmethod
    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        """Return a parsed JSON dict. Implementations are responsible for
        instructing the underlying model to return ONLY JSON and for
        parsing/validating the response."""
        raise NotImplementedError


class TemplateLLMClient(LLMClient):
    

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        # The offline fallback has to serve multiple agents with different
        # output shapes (event-creation content vs. per-channel marketing
        # copy) through the same single-method interface. Branch on a
        # distinctive marker in the system prompt rather than assuming one
        # fixed shape -- a real LLM infers this from the prompt naturally;
        # this fallback has to do it explicitly.
        if "WhatsApp" in system_prompt:
            return self._whatsapp_template(user_prompt)
        if "email" in system_prompt.lower() and "subject" in system_prompt.lower():
            return self._email_template(user_prompt)
        if "X (Twitter)" in system_prompt:
            return self._x_template(user_prompt)
        return self._event_creation_template(user_prompt)

    @staticmethod
    def _parse_fields(user_prompt: str) -> dict:
        try:
            return json.loads(user_prompt)
        except (json.JSONDecodeError, TypeError):
            return {}

    def _whatsapp_template(self, user_prompt: str) -> dict:
        f = self._parse_fields(user_prompt)
        price_bit = f" from ${f['price']:.0f}" if f.get("price") is not None else ""
        return {"message": f"🎟️ {f.get('title', 'Big event')} is happening in {f.get('location', 'your city')}! "
                            f"Tickets{price_bit} -- grab yours before they sell out!"}

    def _email_template(self, user_prompt: str) -> dict:
        f = self._parse_fields(user_prompt)
        title = f.get("title", "This Event")
        location = f.get("location", "your city")
        price_bit = f" starting at ${f['price']:.0f}" if f.get("price") is not None else ""
        return {
            "subject": f"Don't miss {title}",
            "body": (
                f"Hi there,\n\n{title} is coming to {location}, and tickets{price_bit} are "
                f"available now.\n\nSecure your seats today before they're gone.\n\nSee you there!"
            ),
        }

    def _x_template(self, user_prompt: str) -> dict:
        f = self._parse_fields(user_prompt)
        title = f.get("title", "Big event")
        location = f.get("location", "")
        category = f.get("category", "event")
        hashtag = "".join(w.capitalize() for w in category.split())
        post = f"🔥 {title} is live in {location}! Get your tickets now. #{hashtag} #LiveEvents"
        if len(post) > 280:
            # hard safety net -- the prompt promises X's 280-char limit, so
            # the fallback must actually guarantee it too, not just usually
            # happen to fit for whatever titles are in today's dataset
            overflow = len(post) - 280 + 1  # +1 for the ellipsis char
            title = title[: max(0, len(title) - overflow)].rstrip() + "…"
            post = f"🔥 {title} is live in {location}! Get your tickets now. #{hashtag} #LiveEvents"
        return {"post": post}

    def _event_creation_template(self, user_prompt: str) -> dict:
        fields = self._parse_fields(user_prompt)

        title = fields.get("title", "This Event")
        category = fields.get("category", "event")
        location = fields.get("location", "your city")
        price = fields.get("price")
        performer = fields.get("performer")

        price_line = f" starting at ${price:.0f}" if price is not None else ""
        matchup = f" featuring {performer}" if performer and performer.lower() not in title.lower() else ""

        description = (
            f"Don't miss {title}{matchup}, live in {location}. "
            f"This {category} event brings top-tier action to fans of all ages -- "
            f"grab your tickets{price_line} before they're gone."
        )

        faqs = [
            {"question": "What time do doors/gates open?",
             "answer": "Doors typically open 1-2 hours before the scheduled start time. Check your ticket for exact details."},
            {"question": "Can I get a refund if I can't attend?",
             "answer": "Refund eligibility depends on the event's cancellation policy. Contact support for options."},
            {"question": "Is there parking available at the venue?",
             "answer": f"Parking availability varies by venue in {location}. We recommend arriving early."},
        ]

        terms = [
            "Tickets are non-transferable unless explicitly stated otherwise.",
            "Entry may be refused without a valid ticket and matching ID where required.",
            "Event details (time, lineup, venue) are subject to change by the organizer.",
            "Refunds are subject to the platform's cancellation policy.",
        ]

        city = location.split(",")[0].strip() if location else location
        seo_keywords = [category, city, "tickets", f"{category} tickets", "live event", "buy tickets online"]
        if performer:
            seo_keywords.insert(1, performer)
        meta_description = f"Buy tickets for {title} in {location}. {category.title()} event, best prices guaranteed."

        return {
            "description": description,
            "faqs": faqs,
            "terms": terms,
            "seo_keywords": seo_keywords,
            "meta_description": meta_description,
        }


class AnthropicLLMClient(LLMClient):
    """
    Real LLM-backed implementation. NOT exercised against a live API in
    this sandbox -- verify with your own key before relying on it.
    Requires: pip install anthropic, and ANTHROPIC_API_KEY (or LLM_API_KEY)
    set in the environment.
    """

    def __init__(self, model: str = "claude-sonnet-5"):
        api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("LLM_API_KEY")
        if not api_key:
            raise RuntimeError("No API key found in ANTHROPIC_API_KEY or LLM_API_KEY")
        try:
            import anthropic
        except ImportError as e:
            raise RuntimeError("pip install anthropic to use AnthropicLLMClient") from e
        self._client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        response = self._client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=system_prompt + "\n\nRespond with ONLY valid JSON, no preamble, no markdown fences.",
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

class OllamaLLMClient(LLMClient):
    """
    Ollama-backed implementation. Runs locally on your machine.
    Requires: pip install ollama, and the Ollama app running in the background.
    """
    def __init__(self, model: str = "llama3.2"):
        # Make sure the model you specify here is one you have pulled
        # e.g., 'ollama pull llama3.2'
        self.model = model
        
        try:
            import ollama
            self.ollama = ollama
        except ImportError as e:
            raise RuntimeError("pip install ollama to use OllamaLLMClient") from e

    def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        # We append a reminder to the system prompt to output JSON
        formatted_system = system_prompt + "\n\nRespond with ONLY valid JSON, no preamble."
        
        response = self.ollama.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": formatted_system},
                {"role": "user", "content": user_prompt}
            ],
            # Passing format='json' forces Ollama to output parseable JSON
            format='json',
            options={"temperature": 0.0} # Low temperature for more deterministic output
        )
        
        text = response['message']['content'].strip()
        
        # Clean up in case the model wraps it in markdown despite instructions
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        
        return json.loads(text)

def get_llm_client() -> LLMClient:
    """Factory: real client if a key is configured, template fallback otherwise."""

    if os.environ.get("USE_OLLAMA") == "true":
         return OllamaLLMClient(model="llama3.2")
    
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("LLM_API_KEY"):
        try:
            return AnthropicLLMClient()
        except RuntimeError:
            pass
    return TemplateLLMClient()
