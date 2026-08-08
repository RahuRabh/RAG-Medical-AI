from __future__ import annotations

from typing import Any
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
_embedding_cache: dict[str, list[float]] = {}

def get_model() -> SentenceTransformer:
    """Singleton accessor that loads the SentranceTransformer model once into memory"""
    global _model
    if _model is None:
        # Downloads and loads 
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

async def get_embedding(text: str) -> list[float]:
    """Generate a 384-dimensional vector embedding for a given text string"""
    if not text:
        return []

    if text in _embedding_cache:
        return _embedding_cache[text]

    model = get_model()
    embedding_array = model.encode(text, normalize_embeddings=True)

    embedding: list[float] = embedding_array.tolist()

    _embedding_cache[text] = embedding
    return embedding