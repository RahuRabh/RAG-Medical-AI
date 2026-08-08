from __future__ import annotations

from datetime import datetime
import math
from typing import Any

from app.helper.text_scoring import term_match_score, tokenize

CURRENT_YEAR: int = datetime.now().year

def score_recency(year: int | None) -> float:
    """Newer papers receive a higher recency score."""
    if not year:
        return 0.25

    age = max(0, CURRENT_YEAR - year)

    if age <= 2:
        return 1.0
    if age <= 5:
        return 0.78
    if age <= 10:
        return 0.52
    return 0.3


def score_credibility(source: dict[str, Any]) -> float:
    """Assigns credibility score based on authority platform and DOI verification."""
    platform = source.get("platform")
    url = source.get("url", "")

    if platform in ("PubMed", "ClinicalTrials.gov"):
        return 1.0

    if platform == "OpenAlex":
        return 0.86 if ("doi.org" in url or url.startswith("https://doi.org")) else 0.72

    return 0.5


def score_completeness(source: dict[str, Any]) -> float:
    """Evaluates paper completeness based on core metadata fields."""
    authors = source.get("authors") or []
    source_type = source.get("type")

    checks = [
        bool(source.get("title")),
        bool(source.get("abstract") or source.get("supportingSnippet")),
        len(authors) > 0 or source_type == "clinical_trial",
        bool(source.get("year")),
        bool(source.get("url")),
    ]

    return sum(checks) / len(checks)


def score_context_bonus(
    source: dict[str, Any],
    query: dict[str, Any]
) -> dict[str, Any]:
    """Grants bonus score to active recruiting clinical trials and location matches."""
    score = 0.0
    reasons: list[str] = []

    if source.get("type") == "clinical_trial":
        trial = source.get("trial") or {}
        status = (trial.get("status") or "").lower()

        active_statuses = ("recruiting", "active", "not yet recruiting")
        if any(val in status for val in active_statuses):
            score += 0.5
            reasons.append("Active or recruiting trial status")

        location_req = query.get("location")
        if location_req:
            location_text = " ".join(trial.get("locations") or []).lower()
            location_tokens = tokenize(location_req)

            if any(token in location_text for token in location_tokens):
                score += 0.5
                reasons.append("Matched requested location")

    return {
        "score": min(1.0, score),
        "reasons": reasons,
    }


def score_relevance(source: dict[str, Any], query: dict[str, Any]) -> float:
    """Computes exact lexical keyword matching for title, abstract, and trial data."""
    disease_terms = tokenize(query.get("disease", ""))
    intent_terms = tokenize(query.get("intent") or query.get("originalMessage", ""))
    terms = disease_terms + intent_terms

    title_score = term_match_score(source.get("title", ""), terms, title_weight=1.4)
    
    abstract_text = f"{source.get('abstract', '')} {source.get('supportingSnippet', '')}"
    abstract_score = term_match_score(abstract_text, terms, title_weight=1.0)

    trial = source.get("trial")
    if trial:
        trial_text = " ".join(
            (trial.get("conditions") or [])
            + (trial.get("interventions") or [])
            + (trial.get("locations") or [])
        )
        trial_score = term_match_score(trial_text, terms, title_weight=1.0)
    else:
        trial_score = 0.0

    return min(1.0, (title_score * 0.55) + (abstract_score * 0.35) + (trial_score * 0.1))


def build_ranking_reasons(
    source: dict[str, Any],
    query: dict[str, Any],
    context_reasons: list[str]
) -> list[str]:
    """Generates human-readable ranking tags for the UI."""
    reasons: list[str] = []
    title = (source.get("title") or "").lower()
    disease_tokens = tokenize(query.get("disease", ""))
    intent_tokens = tokenize(query.get("intent") or query.get("originalMessage", ""))

    if any(token in title for token in disease_tokens):
        reasons.append("Matched disease in title")

    if any(token in title for token in intent_tokens):
        reasons.append("Matched query intent in title")

    year = source.get("year")
    if year and (CURRENT_YEAR - year <= 5):
        reasons.append("Recent source")

    platform = source.get("platform")
    if platform in ("PubMed", "ClinicalTrials.gov"):
        reasons.append(f"{platform} source")

    reasons.extend(context_reasons)
    return reasons[:4]


def score_concept_match(source: dict[str, Any], query_terms: list[str]) -> float:
    """Grants bonus score if source OpenAlex concepts match user query terms."""
    concepts = source.get("concepts")
    if not concepts:
        return 0.0

    concept_text = " ".join(
        c.get("display_name", "").lower() for c in concepts if isinstance(c, dict)
    )

    score = sum(0.1 for term in query_terms if term in concept_text)
    return min(score, 0.3)


def rank_sources(
    candidates: list[dict[str, Any]],
    understood_query: dict[str, Any],
    selected_limit: int = 8
) -> dict[str, Any]:
    """Ranks candidates using a hybrid weighted matrix (Lexical + Semantic + Recency + Authority)."""
    raw_query_terms = [
        understood_query.get("intent"),
        understood_query.get("disease"),
        understood_query.get("originalMessage"),
    ]
    
    query_terms = [
        term.lower()
        for term in " ".join(filter(None, raw_query_terms)).split()
        if term
    ]

    ranked_sources: list[dict[str, Any]] = []

    for source in candidates:
        relevance = score_relevance(source, understood_query)
        recency = score_recency(source.get("year"))
        credibility = score_credibility(source)
        completeness = score_completeness(source)
        context_bonus = score_context_bonus(source, understood_query)

        # Retrieve semantic vector score calculated by sentence-transformers
        raw_semantic = source.get("semanticScore", 0.0)
        semantic_score = float(raw_semantic) if isinstance(raw_semantic, (int, float)) and math.isfinite(raw_semantic) else 0.0

        concept_score = score_concept_match(source, query_terms)

        # Weighted Hybrid Formula v2
        final_score = (
            (relevance * 0.3)
            + (semantic_score * 0.3)
            + (recency * 0.15)
            + (credibility * 0.15)
            + (completeness * 0.05)
            + (concept_score * 0.1)
        )

        ranked_sources.append({
            **source,
            "scores": {
                "relevance": round(relevance, 4),
                "semantic": round(semantic_score, 4),
                "concept": round(concept_score, 4),
                "recency": round(recency, 4),
                "credibility": round(credibility, 4),
                "completeness": round(completeness, 4),
                "contextBonus": round(context_bonus["score"], 4),
                "final": round(final_score, 4),
            },
            "rankingReason": build_ranking_reasons(
                source,
                understood_query,
                context_bonus["reasons"]
            ),
        })

    # Sort all candidates by final score descending
    ranked_sources.sort(key=lambda x: x["scores"]["final"], reverse=True)

    # Pick top publications and clinical trials
    selected_publications = [s for s in ranked_sources if s.get("type") == "publication"][:10]
    selected_trials = [s for s in ranked_sources if s.get("type") == "clinical_trial"][:5]

    top_sources = selected_publications + selected_trials
    top_sources.sort(key=lambda x: x["scores"]["final"], reverse=True)
    top_sources = top_sources[:selected_limit]

    highest_score = round(ranked_sources[0]["scores"]["final"], 3) if ranked_sources else 0.0

    ranking_stats = {
        "rankedCount": len(ranked_sources),
        "selectedCount": len(top_sources),
        "highestScore": highest_score,
    }

    return {
        "rankedSources": ranked_sources,
        "topSources": top_sources,
        "rankingStats": ranking_stats,
    }