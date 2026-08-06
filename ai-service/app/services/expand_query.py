from typing import Any, TypedDict

class QueryExpansion(TypedDict):
    primaryQuery: str
    publicationQueries: list[str]
    clinicalTrialQueries: list[str]
    displayQuery: str

async def expand_query(understood_query: dict[str, Any]) -> dict[str, Any]:
    disease = understood_query.get("disease", "").strip()
    intent = understood_query.get("intent", "").strip()
    message = understood_query.get("originalMessage", "").strip()

    primary_query = f"{disease} {intent}".strip() or message

    publication_queries = [
        primary_query,
        f"{disease} treatment" if disease else primary_query,
        disease,  # Broad fallback
    ]
    # Remove duplicates and empty strings while preserving order
    publication_queries = list(dict.fromkeys(filter(None, publication_queries)))

    clinical_trial_queries = [
        disease,
        primary_query,
    ]
    clinical_trial_queries = list(dict.fromkeys(filter(None, clinical_trial_queries)))

    return {
        "primaryQuery": primary_query,
        "publicationQueries": publication_queries,
        "clinicalTrialQueries": clinical_trial_queries,
        "displayQuery": f"{intent} for {disease}" if disease and intent else primary_query,
    }