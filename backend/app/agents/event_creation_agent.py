

from dataclasses import dataclass, field

from app.llm.client import LLMClient, get_llm_client
from app.llm.validation import category_mentioned_correctly

SYSTEM_PROMPT = """You are an event marketing copywriter for a ticket booking platform.
Given structured details about an event, generate:
- description: a compelling 2-3 sentence event description
- faqs: a list of 3-5 {question, answer} objects covering common attendee questions
  (doors/entry time, refund policy, parking/accessibility, age restrictions)
- terms: a list of 4-6 short terms & conditions strings
- seo_keywords: a list of 5-8 relevant search keywords
- meta_description: a single SEO meta description under 160 characters

Return ONLY a JSON object with exactly these five keys."""


@dataclass
class EventCreationAssistantAgent:
    llm_client: LLMClient = None  # type: ignore[assignment]
    known_categories: list[str] = field(default_factory=list)

    def __post_init__(self):
        if self.llm_client is None:
            self.llm_client = get_llm_client()

    @staticmethod
    def _build_prompt(title: str, category: str, location: str,
                       price: float | None, performer: str | None) -> str:
        import json
        return json.dumps({
            "title": title, "category": category, "location": location,
            "price": price, "performer": performer,
        })

    def generate_event_content(
        self,
        title: str,
        category: str,
        location: str,
        price: float | None = None,
        performer: str | None = None,
    ) -> dict:
        """Returns {description, faqs, terms, seo_keywords, meta_description}.
        Organizer reviews/edits before publishing -- this is a draft, not
        final copy."""
        user_prompt = self._build_prompt(title, category, location, price, performer)
        result = self.llm_client.generate_json(SYSTEM_PROMPT, user_prompt)
        self._validate(result)
        warnings = []
        if self.known_categories:
            for field_name in ("description", "meta_description"):
                ok, msg = category_mentioned_correctly(
                    result[field_name], category, self.known_categories
                )
                if not ok:
                    warnings.append(f"[{field_name}] {msg}")
        if warnings:
            result["_warnings"] = warnings
        return result

    @staticmethod
    def _validate(result: dict) -> None:
        required = {"description", "faqs", "terms", "seo_keywords", "meta_description"}
        missing = required - result.keys()
        if missing:
            raise ValueError(f"LLM output missing required fields: {missing}")
        if not isinstance(result["faqs"], list) or not all(
            isinstance(f, dict) and "question" in f and "answer" in f for f in result["faqs"]
        ):
            raise ValueError("faqs must be a list of {question, answer} objects")
        if not isinstance(result["terms"], list):
            raise ValueError("terms must be a list of strings")


if __name__ == "__main__":
    agent = EventCreationAssistantAgent()
    print(f"Using LLM client: {type(agent.llm_client).__name__}\n")

    test_events = [
        {"title": "Dallas Cowboys vs Philadelphia Eagles", "category": "football",
         "location": "Arlington, TX", "price": 162.0, "performer": "Dallas Cowboys"},
        {"title": "Salt Lake City Winter Classic", "category": "hockey",
         "location": "Salt Lake City, UT", "price": 136.0, "performer": "Utah Mammoth"},
    ]

    for ev in test_events:
        print(f"=== {ev['title']} ===")
        content = agent.generate_event_content(**ev)
        print("Description:", content["description"])
        print("FAQs:")
        for f in content["faqs"]:
            print(f"  Q: {f['question']}\n  A: {f['answer']}")
        print("Terms:")
        for t in content["terms"]:
            print(f"  - {t}")
        print("SEO keywords:", content["seo_keywords"])
        print("Meta description:", content["meta_description"])
        print()
