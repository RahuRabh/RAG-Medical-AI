# app/helper/openalex.py
from __future__ import annotations

import math
from typing import Any
from app.helper.http import fetch_with_timeout


def reconstruct_abstract(index: dict[str, list[int]] | None) -> str:
    if not index:
        return ""

    words_with_pos = []
    for word, positions in index.items():
        for pos in positions:
            words_with_pos.append({"word": word, "position": pos})

    words_with_pos.sort(key=lambda item: item["position"])
    return " ".join(item["word"] for item in words_with_pos)


async def fetch_open_alex_sources(
    queries: list[str],
    limit: int = 50
) -> list[dict[str, Any]]:
    # Pick the broad query (e.g., "androgenetic alopecia")
    query_term = next((q for q in reversed(queries) if q), "")
    if not query_term:
        return []

    params = {
        "search": query_term,
        "per-page": str(min(limit, 50)),
        "page": "1",
        "sort": "relevance_score:desc",
    }

    res = await fetch_with_timeout("https://api.openalex.org/works", params=params)
    payload = res.json()

    results = []
    for work in payload.get("results", []):
        abstract = reconstruct_abstract(work.get("abstract_inverted_index"))
        title = work.get("display_name") or work.get("title") or "Untitled OpenAlex work"
        
        landing_url = work.get("primary_location", {}).get("landing_page_url") if work.get("primary_location") else None
        url = work.get("doi") or landing_url or work.get("id") or "https://openalex.org/"

        authors = [
            a.get("author", {}).get("display_name")
            for a in work.get("authorships", [])
            if a.get("author", {}).get("display_name")
        ][:8]

        results.append({
            "type": "publication",
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "year": work.get("publication_year"),
            "platform": "OpenAlex",
            "url": url,
            "supportingSnippet": abstract[:260] or title,
            # "raw": work,
        })

    return results[:limit]