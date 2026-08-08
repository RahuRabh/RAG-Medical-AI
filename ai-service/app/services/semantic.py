from __future__ import annotations

import math
from typing import Any

from app.helper.debug import debug_log
from app.helper.embedding import get_embedding
from app.helper.similarity import cosine_similarity

async def add_semantic_scores(
        candidates: list[dict[str, Any]],
        understood_query: dict[str, Any]
) -> list[dict[str, Any]]:
    """d"""
    query_text = (
        understood_query.get("normalizedQuery")
        or " ".join(
            filter(
                None,
                [
                    understood_query.get("intent"),
                    understood_query.get("disease"),
                    understood_query.get("originalMessage"),
                ],
            )
        ).strip()
    )

    if not query_text:
        print("X Empty queryText - skipping semantic scoring")
        return [{**c, "semanticScore": 0.0} for c in candidates]

    query_embedding = await get_embedding(query_text)

    updated: list[dict[str, Any]] = []

    for source in candidates:
        source_text = " ".join(
            filter(
                None,
                [
                    source.get("title"),
                    source.get("abstract"),
                    source.get("supportingSnippet"),
                ],
            )
        ).strip()

        if not source_text:
            updated.append({**source, "semanticScore": 0.0})
            continue

        source_embedding = await get_embedding(source_text)

        if not source_embedding:
            updated.append({**source, "semanticScore": 0.0})
            continue

        score = cosine_similarity(query_embedding, source_embedding)

        if not math.isfinite(score):
            score = 0.0

        updated.append({**source, "semanticScore": round(score, 4)})

    return updated