from __future__ import annotations

import logging
from typing import Any

from app.helper.groq_client import (
    fallback_answer,
    generate_groq_medical_answer,
    parse_medical_answer,
)

from app.models.request import AIRequest
from app.services.understand_query import understand_query
from app.services.expand_query import expand_query
from app.services.retrieve_sources import retrieve_sources
from app.services.semantic import add_semantic_scores
from app.services.rank_sources import rank_sources
from app.services.prompt_builder import build_medical_prompt

logger = logging.getLogger(__name__)

async def process_chat_request(request: AIRequest) -> dict[str, Any]:

    structured_ctx_dict = (
        request.structured_context.model_dump() 
        if request.structured_context 
        else {}
    )
    
    conversation_ctx_dict = (
        request.conversation_context.model_dump()
        if request.conversation_context
        else {}
    )

    # Natural Language Query Understanding
    understood_query = await understand_query(
        message=request.message,
        structured_context=structured_ctx_dict,
        conversation_context=conversation_ctx_dict
    )

    # Multi-Target Query Expansion
    expanded_query = await expand_query(understood_query)

    extracted_context = {
        "patientName": understood_query.get("patientName", ""),
        "disease": understood_query.get("disease", ""),
        "intent": understood_query.get("intent", ""),
        "location": understood_query.get("location", ""),
    }

    # Concurrent Multi-Source Retrieval
    retrieval = await retrieve_sources(
        expanded_query,
        understood_query
    )

    # Vector Embedding & Cosine Similarity Scoring
    semantic_candidates = await add_semantic_scores(
        retrieval["candidates"],
        understood_query,
    )

    #Multi-Factor Hybrid Ranking
    ranking = rank_sources(
        candidates=semantic_candidates,
        understood_query=understood_query,
        selected_limit=30,
    )

    top_sources = ranking.get("topSources", [])

    try:
        prompt = build_medical_prompt(
            message=request.message,
            context=understood_query,
            sources=top_sources,
        )
        raw_answer = await generate_groq_medical_answer(prompt)
        answer = parse_medical_answer(raw_answer, top_sources)
    except Exception as exc:
        logger.error(f"========== LLM ERROR ==========: {exc}")
        answer = fallback_answer(top_sources)

    # Clean candidate sources output for response schema
    sources = [
        {
            "type": s.get("type"),
            "title": s.get("title"),
            "abstract": s.get("abstract"),
            "authors": s.get("authors", []),
            "year": s.get("year"),
            "platform": s.get("platform"),
            "url": s.get("url"),
            "supportingSnippet": s.get("supportingSnippet"),
            "trial": s.get("trial"),
            "scores": s.get("scores"),
            "rankingReason": s.get("rankingReason", []),
        }
        for s in top_sources
    ]

    return {
        "answer": answer,
        "sources": sources,
        "context": extracted_context,
        "metadata": {
            "retrievalStats": retrieval.get("stats"),
            "expandedQuery": expanded_query,
            "activeContext": understood_query,
            "rankingStats": ranking.get("rankingStats"),
        },
    }