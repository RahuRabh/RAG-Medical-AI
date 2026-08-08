from __future__ import annotations

import numpy as np

def cosine_similarity(a: list[float] | np.ndarray, b: list[float] | np.ndarray) -> float:
    """Calculate cosine similarity between two vector embeddings"""
    if a is None or b is None or len(a) != len(b):
        return 0.0

    vec_a = np.asarray(a, dtype=np.float32)
    vec_b = np.asarray(b, dtype=np.float32)

    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    # Dot product divided by product of Euclidean norms
    similarity = np.dot(vec_a, vec_b) / (norm_a * norm_b)

    # Return as standard Python float
    return float(np.nan_to_num(similarity))