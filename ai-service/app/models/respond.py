from __future__ import annotations
from typing import Any
from pydantic import BaseModel


class RetrievalStats(BaseModel):
    openAlexCount: int
    pubMedCount: int
    clinicalTrialsCount: int
    totalBeforeDedup: int
    totalAfterDedup: int
    errors: list[str]


class RetrievalResult(BaseModel):
    candidates: list[dict[str, Any]]
    stats: RetrievalStats