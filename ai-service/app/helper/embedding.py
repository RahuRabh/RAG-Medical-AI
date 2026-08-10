# from typing import Any
# from sentence_transformers import SentenceTransformer

# import os
# import logging

# import httpx

# logger = logging.getLogger(__name__)

# _embedding_cache: dict[str, list[float]] = {}

# _model: SentenceTransformer | None = None

# def get_model() -> SentenceTransformer:
#     """Singleton accessor that loads the SentranceTransformer model once into memory"""
#     global _model
#     if _model is None:
#         # Downloads and loads 
#         _model = SentenceTransformer("all-MiniLM-L6-v2")
#     return _model

# async def get_embedding(text: str) -> list[float]:
#     """Generate a 384-dimensional vector embedding for a given text string"""
#     if not text:
#         return []

#     if text in _embedding_cache:
#         return _embedding_cache[text]

#     model = get_model()
#     embedding_array = model.encode(text, normalize_embeddings=True)

#     embedding: list[float] = embedding_array.tolist()

#     _embedding_cache[text] = embedding
#     return embedding


# app/helper/embedding.py
from __future__ import annotations

import os
import logging
import asyncio
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

_embedding_cache: dict[str, list[float]] = {}
_client: InferenceClient | None = None


def get_client() -> InferenceClient:
    global _client
    if _client is None:
        hf_token = os.getenv("HF_TOKEN", "").strip()
        _client = InferenceClient(
            model="sentence-transformers/all-MiniLM-L6-v2",
            token=hf_token if hf_token else None,
        )
    return _client


async def get_embedding(text: str) -> list[float]:
    """Generates a 384-dim vector embedding using Hugging Face's lightweight InferenceClient."""
    if not text:
        return []

    if text in _embedding_cache:
        return _embedding_cache[text]

    try:
        client = get_client()

        # Run feature extraction in async executor thread (since client call is synchronous)
        loop = asyncio.get_event_loop()
        embedding_array = await loop.run_in_executor(
            None, lambda: client.feature_extraction(text)
        )

        # Convert numpy array/list to standard python list of floats
        if hasattr(embedding_array, "tolist"):
            embedding = embedding_array.tolist()
        else:
            embedding = list(embedding_array)

        # Handle 2D list array wrappers [[0.1, 0.2, ...]]
        if len(embedding) > 0 and isinstance(embedding[0], list):
            embedding = embedding[0]

        # Ensure all elements are standard floats
        embedding = [float(x) for x in embedding]

        _embedding_cache[text] = embedding
        return embedding

    except Exception as exc:
        logger.error(f"❌ Hugging Face Embedding API Error: {exc}")
        return []