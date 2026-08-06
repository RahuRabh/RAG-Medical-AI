# app/helper/clinicaltrials.py
from __future__ import annotations

import re
from typing import Any
from app.helper.http import fetch_with_timeout


def parse_year(date_str: str | None) -> int | None:
    if not date_str:
        return None
    match = re.search(r"\d{4}", date_str)
    return int(match.group(0)) if match else None


def format_locations(study: dict) -> list[str]:
    protocol = study.get("protocolSection", {})
    locations = protocol.get("contactsLocationsModule", {}).get("locations", [])
    
    formatted = []
    for loc in locations:
        parts = [
            loc.get("facility"),
            loc.get("city"),
            loc.get("state"),
            loc.get("country"),
        ]
        valid_parts = [p for p in parts if p]
        if valid_parts:
            formatted.append(", ".join(valid_parts))

    return formatted[:8]


async def fetch_clinical_trials_sources(
    disease: str,
    queries: list[str],
    limit: int = 25
) -> list[dict[str, Any]]:
    # Prefer disease term directly for query.cond
    cond_term = disease or (queries[0] if queries else "")
    if not cond_term:
        return []

    params = {
        "query.cond": cond_term,
        "pageSize": str(limit),
        "format": "json",
    }

    res = await fetch_with_timeout(
        "https://clinicaltrials.gov/api/v2/studies",
        params=params,
        timeout_seconds=14.0,
    )
    data = res.json()
    studies = data.get("studies", [])

    results = []
    for study in studies:
        protocol = study.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        desc = protocol.get("descriptionModule", {})
        status_mod = protocol.get("statusModule", {})

        nct_id = ident.get("nctId")
        title = (
            ident.get("briefTitle")
            or ident.get("officialTitle")
            or "Untitled clinical trial"
        )
        abstract = desc.get("briefSummary") or desc.get("detailedDescription") or ""
        locations = format_locations(study)
        status = status_mod.get("overallStatus")

        start_date = status_mod.get("startDateStruct", {}).get("date")
        year = parse_year(start_date)

        url = f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else "https://clinicaltrials.gov/"
        snippet = abstract[:260] or " - ".join(filter(None, [status] + locations)) or title

        interventions = [
            item.get("name")
            for item in protocol.get("armsInterventionsModule", {}).get("interventions", [])
            if item.get("name")
        ]

        results.append({
            "type": "clinical_trial",
            "title": title,
            "abstract": abstract,
            "authors": [],
            "year": year,
            "platform": "ClinicalTrials.gov",
            "url": url,
            "supportingSnippet": snippet,
            # "trial": {
            #     "nctId": nct_id,
            #     "status": status,
            #     "phase": ", ".join(protocol.get("designModule", {}).get("phases", [])),
            #     "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
            #     "interventions": interventions,
            #     "locations": locations,
            # },
        })

    return results