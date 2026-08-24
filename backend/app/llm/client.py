"""
client.py — Pluggable LLM client for the GenAI-backed agents (Event
Creation Assistant, Marketing Campaign, Customer Support).

Every agent calls `generate(system, prompt)` and catches `LLMUnavailable`
to fall back to its own deterministic template -- so the app runs with
useful output out of the box, and upgrades to real generation the moment
LLM_PROVIDER/LLM_API_KEY/LLM_MODEL are set (in `.env` or the environment).
No key is bundled with this codebase; nothing calls out to any LLM unless
the deployer configures one.

IMPORTANT: `generate()` returns a raw string. Callers that need structured
content (event_creation_agent.py, marketing_agent.py) parse that string as
JSON themselves -- the system prompt they pass in is what instructs the
model to respond with JSON. support_agent.py, by contrast, uses the raw
string directly as a plain-text chat reply. This module must NOT assume
one shape for the return value -- it always returns exactly what the
model said, as text.

Two providers implemented: Anthropic (hosted) and Ollama (local). Select
via LLM_PROVIDER ("anthropic" or "ollama") in `.env`/environment, matching
the existing settings surface (app/core/config.py) rather than adding a
separate flag.
"""

import os

import httpx

from app.core.config import get_settings

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

DEFAULT_OLLAMA_MODEL = "llama3.2"


class LLMUnavailable(Exception):
    """Raised when no LLM provider is configured, or the call fails --
    callers should catch this and use their own template fallback rather
    than surface an error to the end user."""


def _call_anthropic(system: str, prompt: str, max_tokens: int) -> str:
    settings = get_settings()
    if not settings.LLM_API_KEY or not settings.LLM_MODEL:
        raise LLMUnavailable("LLM_API_KEY and LLM_MODEL must both be set to use the anthropic provider")

    try:
        response = httpx.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": settings.LLM_API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json={
                "model": settings.LLM_MODEL,
                "max_tokens": max_tokens,
                "system": system,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise LLMUnavailable(f"Anthropic API call failed: {exc}") from exc

    data = response.json()
    text_parts = [block["text"] for block in data.get("content", []) if block.get("type") == "text"]
    text = "\n".join(text_parts).strip()
    if not text:
        raise LLMUnavailable("Anthropic API returned no text content")
    return text


def _call_ollama(system: str, prompt: str, max_tokens: int) -> str:
    try:
        import ollama
    except ImportError as exc:
        raise LLMUnavailable("pip install ollama to use the ollama provider") from exc

    settings = get_settings()
    # LLM_MODEL is reused for whichever provider is active -- falls back to
    # a sane default so LLM_PROVIDER=ollama works without also requiring
    # LLM_MODEL to be set (unlike Anthropic, Ollama has a usable local default).
    model = settings.LLM_MODEL or os.environ.get("OLLAMA_MODEL") or DEFAULT_OLLAMA_MODEL

    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            options={"num_predict": max_tokens, "temperature": 0.0},
        )
    except Exception as exc:  # ollama raises its own error types; broad catch is intentional here
        raise LLMUnavailable(f"Ollama call failed: {exc}") from exc

    text = (response.get("message", {}) or {}).get("content", "").strip()
    if not text:
        raise LLMUnavailable("Ollama returned no text content")
    return text


def generate(system: str, prompt: str, max_tokens: int = 1024) -> str:
    settings = get_settings()
    provider = (settings.LLM_PROVIDER or "none").lower()
    if provider == "anthropic":
        return _call_anthropic(system, prompt, max_tokens)
    if provider == "ollama":
        return _call_ollama(system, prompt, max_tokens)
    raise LLMUnavailable(f"No LLM provider configured (LLM_PROVIDER={settings.LLM_PROVIDER!r})")