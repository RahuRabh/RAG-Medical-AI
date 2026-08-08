import asyncio
import re
from typing import Any

from app.helper.clinicaltrials import fetch_clinical_trials_sources
from app.helper.openalex import fetch_open_alex_sources
from app.helper.pubmed import fetch_pub_med_sources

from app.models.respond import RetrievalResult, RetrievalStats

def normalize_key(source: dict) -> str:
    trial_id = source.get("trial", {}).get("nctId")
    if trial_id:
        return f"trial:{trial_id.lower()}"

    url = source.get("url")
    if url:
        return f"url:{re.sub(r'/$', '', url.lower())}"

    title = source.get("title", "")
    clean_title = re.sub(r"\W+", " ", title.lower()).strip()
    return f"title:{clean_title}"

def dedupe_source(sources: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}

    for source in sources:
        key = normalize_key(source)
        existing = seen.get(key)

        if not existing:
            seen[key] = source
            continue

        existing_len = len(existing.get("abstract") or "")
        source_len = len(source.get("abstract") or "")

        if source_len > existing_len:
            seen[key] = source

    return list(seen.values())

async def settle_source(name: str, coro) -> dict[str, Any]:
    try:
        sources = await coro
        return {"name": name, "sources": sources, "error": ""}
    except Exception as exc:
        return {"name": name, "sources": [], "error": f"{name}: {str(exc)}"}

async def retrieve_sources(
        expanded_query: dict[str, Any],
        understood_query: dict[str, Any]
) -> RetrievalResult:
    open_alex_res, pub_med_res, clinical_trials_res = await asyncio.gather(
        settle_source(
            "OpenAlex",
            fetch_open_alex_sources(expanded_query.get("publicationQueries", []), 100)
        ),
        settle_source(
            "PubMed",
            fetch_pub_med_sources(expanded_query.get("publicationQueries", []), 100)
        ),
        settle_source(
            "ClinicalTrials.gov",
            fetch_clinical_trials_sources(
                disease=understood_query.get("disease", ""),
                queries=expanded_query.get("clinicalTrialQueries", []),
                limit=50,
            )
        )
    )

    candidates = (
        open_alex_res["sources"]
        + pub_med_res["sources"]
        + clinical_trials_res["sources"]
    )

    deduped = dedupe_source(candidates)

    errors = [
        err for err in [
            open_alex_res["error"],
            pub_med_res["error"],
            clinical_trials_res["error"]
        ] if err
    ]

    stats = {
        "openAlexCount": len(open_alex_res["sources"]),
        "pubMedCount": len(pub_med_res["sources"]),
        "clinicalTrialsCount": len(clinical_trials_res["sources"]),
        "totalBeforeDedup": len(candidates),
        "totalAfterDedup": len(deduped),
        "errors": errors
    }

    return {
        "candidates": deduped,
        "stats": RetrievalStats(**stats),
    }