"""
llm/validation.py — Shared content-consistency checks for LLM-generated
agent output.

Structural validation (right JSON keys, right types) doesn't catch content
that's internally WRONG -- e.g. an LLM describing a hockey event as
"professional basketball" while the category field it was given said
"hockey" (this happened in real testing with a local Ollama model). These
checks catch that class of problem. They are deliberately lightweight
(substring/keyword checks, not another LLM call) so they're cheap enough to
run on every generation.

Used by both event_creation_agent.py and marketing_agent.py.
"""


def category_mentioned_correctly(text: str, category: str, other_categories: list[str]) -> tuple[bool, str | None]:
    """
    Returns (is_consistent, warning_message).
    Flags the common failure mode: generated text names a DIFFERENT known
    category than the one it was actually given (e.g. says "basketball"
    for a hockey event) rather than just checking the right category is
    present (organizers may reasonably not repeat "hockey" verbatim in
    good marketing copy -- that's not an error).
    """
    text_low = text.lower()
    wrong_categories_mentioned = [
        c for c in other_categories
        if c.lower() != category.lower() and c.lower() in text_low
    ]
    if wrong_categories_mentioned:
        return False, (
            f"Generated text mentions other category term(s) "
            f"{wrong_categories_mentioned} but event category is '{category}' -- "
            f"likely LLM hallucination, review before publishing."
        )
    return True, None
