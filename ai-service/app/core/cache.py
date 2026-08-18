import hashlib
import json
from typing import Any, TypedDict

def build_retrieval_cache_key(expanded_query, understood_query):
    cache_input = {
        "primaryQuery": expanded_query.get("primaryQuery", ""),
        "publicationQueries": expanded_query.get("publicationQueries", []),
        "clinicalTrialQueries": expanded_query.get("clinicalTrialQueries", []),
        "disease": understood_query.get("disease", ""),
        "intent": understood_query.get("intent", ""),
    }

    print("===== CACHE INPUT ======")
    print(cache_input)

    serialized = json.dumps(
        cache_input,
        sort_keys=True,
        separators=(",", ":"),
    )

    digest = hashlib.sha256(
        serialized.encode("utf-8")
    ).hexdigest()

    key = f"retrieval:{digest}"

    print("CACHE KEY:", key)

    return key