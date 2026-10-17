
import re
from dataclasses import dataclass

import pandas as pd

from app.recommendation.model import ContentBasedRecommender

# --- price-phrase patterns, checked in order -------------------------------
PRICE_PATTERNS = [
    re.compile(r"under\s*\$?(\d+)", re.I),
    re.compile(r"below\s*\$?(\d+)", re.I),
    re.compile(r"less than\s*\$?(\d+)", re.I),
    re.compile(r"(?:budget|max|up to)\s*(?:of\s*)?\$?(\d+)", re.I),
    re.compile(r"\$(\d+)\s*or less", re.I),
]


STATE_NAME_TO_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI",
    "wyoming": "WY", "district of columbia": "DC",
    "alberta": "AB", "manitoba": "MB", "ontario": "ON", "quebec": "QC",
}

# Filler words that commonly survive after category/location/price are
# stripped out of a query. Without this, "basketball near Atlanta" leaves
# "near" behind, which then gets used as a mandatory (and unmatchable)
# keyword filter -- silently zeroing out results for an otherwise-valid query.
STOPWORDS = {
    "near", "in", "at", "for", "the", "a", "an", "of", "on",
    "games", "game", "events", "event", "tickets", "ticket",
    "under", "below", "less", "than", "budget", "max", "up", "to", "or",
    "anything", "any", "some", "show", "me", "find", "search",
    "please", "want", "looking", "look", "give",
}


@dataclass
class ParsedIntent:
    category: str | None
    location: str | None       # matched city or state
    max_price: float | None
    keywords: str              # leftover free text, for name/performer search
    raw_query: str


class EventDiscoveryAgent:
    def __init__(self, events: pd.DataFrame, recommender: ContentBasedRecommender | None = None):
        self.events = events
        self.recommender = recommender  # optional: enables personalized ranking of results
        self.categories = sorted(events["category"].dropna().unique().tolist())
        self.cities = sorted(events["venue_city"].dropna().unique().tolist())
        self.states = sorted(events["venue_state"].dropna().unique().tolist())
        self._init_semantic_index()

    def _init_semantic_index(self):
        """Build TF-IDF semantic vector space over event corpus for hybrid retrieval."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        names = self.events.get("name", pd.Series([""] * len(self.events))).fillna("")
        cats = self.events.get("category", pd.Series([""] * len(self.events))).fillna("")
        performers = self.events.get("primary_performer_name", pd.Series([""] * len(self.events))).fillna("")
        cities = self.events.get("venue_city", pd.Series([""] * len(self.events))).fillna("")
        venues = self.events.get("venue_name", pd.Series([""] * len(self.events))).fillna("")

        corpus = (names + " " + cats + " " + performers + " " + cities + " " + venues).tolist()
        self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=5000)
        if len(corpus) > 0 and any(len(text.strip()) > 0 for text in corpus):
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
        else:
            self.tfidf_matrix = None


    # ------------------------------------------------------------------ #
    # Stage 1: intent parsing
    # ------------------------------------------------------------------ #
    def parse_intent(self, query: str) -> ParsedIntent:
        """
        Rule-based NLU. Swap point for an LLM-backed version later: keep the
        same ParsedIntent return shape and every downstream caller (this
        agent's `search()`, and any API route built on top of it) keeps
        working unchanged.
        """
        remaining = query

        category = self._match_vocab(remaining, self.categories)
        location, location_matched_text = self._resolve_location(remaining)

        max_price = None
        for pattern in PRICE_PATTERNS:
            m = pattern.search(remaining)
            if m:
                max_price = float(m.group(1))
                remaining = remaining[:m.start()] + remaining[m.end():]
                break

        # strip matched category/location tokens (word-boundary safe -- won't
        # mangle unrelated words the way a bare substring removal would).
        # Use the LITERAL matched text for location (e.g. "Texas"), not the
        # canonical abbreviation ("TX") which may never appear verbatim.
        for token in filter(None, [category, location_matched_text]):
            remaining = re.sub(rf"\b{re.escape(token)}\b", "", remaining, flags=re.I)

        leftover_tokens = [t for t in re.findall(r"[A-Za-z']+", remaining) if t.lower() not in STOPWORDS]
        keywords = " ".join(leftover_tokens)

        return ParsedIntent(
            category=category, location=location, max_price=max_price,
            keywords=keywords, raw_query=query,
        )

    @staticmethod
    def _match_vocab(text: str, vocab: list[str]) -> str | None:
        """Word-boundary match against a vocab list, longest term first so
        multi-word city names win over any shorter overlapping term."""
        for term in sorted(vocab, key=len, reverse=True):
            if re.search(rf"\b{re.escape(term)}\b", text, flags=re.I):
                return term
        return None

    def _resolve_location(self, text: str) -> tuple[str | None, str | None]:
        """Returns (canonical_value, literal_matched_text). For cities and
        state abbreviations these are the same string; for a full state
        name they differ (canonical='TX', literal='Texas')."""
        city = self._match_vocab(text, self.cities)
        if city:
            return city, city
        abbr = self._match_state_abbr(text, self.states)
        if abbr:
            return abbr, abbr
        for name in sorted(STATE_NAME_TO_ABBR, key=len, reverse=True):
            if re.search(rf"\b{re.escape(name)}\b", text, flags=re.I):
                return STATE_NAME_TO_ABBR[name], name
        return None, None

    @staticmethod
    def _match_state_abbr(text: str, vocab: list[str]) -> str | None:
        """
        2-letter state/province codes need CASE-SENSITIVE matching. Many are
        also ordinary lowercase English words -- "in", "or", "co", "ga",
        "ok", "pa", "hi", "me", "wa" are all valid state abbreviations AND
        common words/connectors. Real abbreviations are conventionally typed
        uppercase ("TX", "CO"), so requiring exact-case avoids treating
        "games in Texas" as a Indiana search.
        """
        for term in vocab:
            if re.search(rf"\b{re.escape(term)}\b", text):  # no IGNORECASE
                return term
        return None

    # ------------------------------------------------------------------ #
    # Stage 2: filter + (optionally personalized) rank
    # ------------------------------------------------------------------ #
    def search(self, query: str, user_id: int | None = None, top_n: int = 10) -> pd.DataFrame:
        intent = self.parse_intent(query)
        candidates = self.events.copy()

        if intent.category:
            candidates = candidates[candidates["category"].str.lower() == intent.category.lower()]
        if intent.location:
            candidates = candidates[
                (candidates["venue_city"].str.lower() == intent.location.lower())
                | (candidates["venue_state"].str.lower() == intent.location.lower())
            ]
        if intent.max_price is not None:
            candidates = candidates[candidates["price_estimated"] <= intent.max_price]
        if intent.keywords:
            mask = (
                candidates["name"].str.contains(intent.keywords, case=False, na=False)
                | candidates["primary_performer_name"].str.contains(intent.keywords, case=False, na=False)
            )
            if mask.any():
                candidates = candidates[mask]
            elif self.tfidf_matrix is not None:
                # Semantic vector search fallback for natural language conceptual queries
                query_vec = self.tfidf_vectorizer.transform([intent.keywords])
                cand_idx = candidates.index.to_numpy()
                cand_tfidf = self.tfidf_matrix[cand_idx]
                sims = (cand_tfidf @ query_vec.T).toarray().ravel()
                pos = sims > 0.05
                if pos.any():
                    candidates = candidates.iloc[pos].copy()
                    candidates["semantic_similarity"] = sims[pos]
                else:
                    candidates = candidates[mask]


        if candidates.empty:
            return candidates

        if user_id is not None and self.recommender is not None and user_id in self.recommender.user_profiles:
            # personalize ranking within the intent-filtered candidates
            profile = self.recommender.user_profiles[user_id]
            from app.recommendation.model import cosine_sim
            scores = candidates["event_id"].map(
                lambda eid: cosine_sim(profile, self.recommender.event_vectors[eid])
            )
            candidates = candidates.assign(score=scores).sort_values("score", ascending=False)
        else:
            # no user context: rank by popularity as a reasonable default
            candidates = candidates.sort_values("event_popularity_score", ascending=False)

        return candidates.head(top_n).reset_index(drop=True)


if __name__ == "__main__":
    from pathlib import Path

    DATA_DIR = Path(r"D:\use_Case2\data\processed")
    events = pd.read_csv(DATA_DIR / "events_clean.csv")
    users = pd.read_csv(DATA_DIR / "users_synthetic.csv")
    interactions = pd.read_csv(DATA_DIR / "interactions_synthetic.csv")

    recommender = ContentBasedRecommender(events=events, users=users, interactions=interactions)
    agent = EventDiscoveryAgent(events=events, recommender=recommender)

    test_queries = [
        "baseball games in Texas under $120",
        "basketball near Atlanta",
        "cowboys under $200",
        "hockey below 150",
        "games in Georgia",              # adversarial: "Georgia" state vs "games" substring
        "football in Colorado",          # adversarial: real "CO" match vs "cowboys"-style false hit
        "san francisco baseball",        # multi-word city
        "anything under $50",            # no category/location, price only
    ]
    for q in test_queries:
        intent = agent.parse_intent(q)
        print(f"\nQuery: {q!r}")
        print(f"  -> parsed: category={intent.category}, location={intent.location}, "
              f"max_price={intent.max_price}, keywords={intent.keywords!r}")
        results = agent.search(q, user_id=1, top_n=3)
        if results.empty:
            print("  -> 0 results")
        else:
            for _, r in results.iterrows():
                print(f"  -> {r['name']} | {r['category']} | {r['venue_city']} | ${r['price_estimated']:.0f}")
