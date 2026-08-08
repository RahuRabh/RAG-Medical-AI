from __future__ import annotations

import re

STOPWORDS: set[str] = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "for",
    "in",
    "is",
    "of",
    "on",
    "or",
    "the",
    "to",
    "what",
    "with",
}


def tokenize(text: str = "") -> list[str]:
    """Tokenizes a text string into lowercased words longer than 2 characters, excluding stopwords."""
    if not text:
        return []

    # Remove quotes/apostrophes and split on non-alphanumeric characters
    cleaned_text = re.sub(r"['’]", "", str(text).lower())
    tokens = re.split(r"[^a-z0-9]+", cleaned_text)

    # Filter length > 2 and remove stopwords
    return [token for token in tokens if len(token) > 2 and token not in STOPWORDS]


def term_match_score(
    text: str = "",
    terms: list[str] | None = None,
    title_weight: float = 1.0
) -> float:
    """Calculates keyword match ratio across unique search terms."""
    if not text or not terms:
        return 0.0

    normalized_text = str(text).lower()
    # Deduplicate terms while preserving uniqueness
    unique_terms = list(dict.fromkeys([t for t in terms if t]))

    if not unique_terms:
        return 0.0

    matches = sum(
        title_weight
        for term in unique_terms
        if term.lower() in normalized_text
    )

    return min(1.0, matches / max(len(unique_terms), 1))