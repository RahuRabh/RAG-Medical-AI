from __future__ import annotations

import math
import asyncio
from typing import Any

from app.helper.embedding import get_embedding
from app.helper.similarity import cosine_similarity

async def add_semantic_scores(
        candidates: list[dict[str, Any]],
        understood_query: dict[str, Any]
) -> list[dict[str, Any]]:
    
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

    #1. Prepare texts for all candidates
    source_texts = [
        " ".join(filter(None, [c.get("title"), c.get("abstract"), c.get("supportingSnippet")])).strip()
        for c in candidates
    ]

    # 2. Fetch ALL candidate embeddings asynchronously in parallel!
    source_embeddings = await asyncio.gather(
        *[get_embedding(text) for text in source_texts],
        return_exceptions=True
    )

    # 3. Calculate scores
    updated = []
    for source, source_emb in zip(candidates, source_embeddings):
        if isinstance(source_emb, Exception) or not source_emb:
            score = 0.0
        else:
            score = cosine_similarity(query_embedding, source_emb)

        updated.append({**source, "semanticScore": round(score, 4)})

    updated.sort(key=lambda item: item.get("semanticScore", 0.0), reverse=True)
    return updated