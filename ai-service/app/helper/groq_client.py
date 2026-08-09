from __future__ import annotations

import json
import os
from typing import Any
from groq import AsyncGroq

# Lazy initialization of the AsyncGroq client
_groq_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    """Singleton getter for the AsyncGroq client."""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        _groq_client = AsyncGroq(api_key=api_key)
    return _groq_client


async def generate_groq_medical_answer(prompt: str) -> str:
    """Calls Groq API enforcing JSON mode response format."""
    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    completion = await client.chat.completions.create(
        model=model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a medical research assistant. Use only the provided evidence. "
                    "Never invent studies, URLs, authors, citations, or statistics. "
                    "If evidence is limited, clearly say so. Do not diagnose or prescribe. "
                    "Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return completion.choices[0].message.content or ""


def fallback_answer(top_sources: list[dict[str, Any]]) -> dict[str, Any]:
    """Fallback generator if the LLM or JSON parsing fails."""
    
    # 1. Format research insights safely
    research_insights = []
    for s in top_sources[:3]:
        platform_info = s.get("platform", "")
        if s.get("year"):
            platform_info += f", {s['year']}"
        title = s.get("title", "Untitled")
        research_insights.append(f"{title} ({platform_info})")

    # 2. Format clinical trials safely
    clinical_trials = []
    for s in top_sources:
        if s.get("type") == "clinical_trial":
            status = s.get("trial", {}).get("status") if isinstance(s.get("trial"), dict) else None
            status_suffix = f" - {status}" if status else ""
            clinical_trials.append(f"{s.get('title', 'Untitled trial')}{status_suffix}")
    clinical_trials = clinical_trials[:2]

    # 3. Format source attribution
    source_attribution = [
        f"{s.get('platform', 'Source')}: {s.get('title', 'Untitled')}"
        for s in top_sources[:5]
    ]

    return {
        "conditionOverview": "The assistant could not generate a full structured answer, but the highest-ranked evidence sources are still available below.",
        "researchInsights": research_insights,
        "clinicalTrials": clinical_trials,
        "personalizedTakeaway": "The ranked sources below can still be used to continue the research session.",
        "sourceAttribution": source_attribution,
        "medicalDisclaimer": "This information is educational only and is not medical advice.",
    }

def parse_medical_answer(raw: str, top_sources: list[dict[str, Any]]) -> dict[str, Any]:
    """Parses JSON response string into dictionary with fallback handling."""
    try:
        parsed = json.loads(raw)
        return {
            "conditionOverview": parsed.get("conditionOverview", ""),
            "researchInsights": parsed.get("researchInsights") if isinstance(parsed.get("researchInsights"), list) else [],
            "clinicalTrials": parsed.get("clinicalTrials") if isinstance(parsed.get("clinicalTrials"), list) else [],
            "personalizedTakeaway": parsed.get("personalizedTakeaway", ""),
            "sourceAttribution": parsed.get("sourceAttribution") if isinstance(parsed.get("sourceAttribution"), list) else [],
            "medicalDisclaimer": parsed.get("medicalDisclaimer", "This information is educational only and is not medical advice."),
        }
    except Exception:
        return fallback_answer(top_sources)