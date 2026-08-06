# app/helper/http.py
from __future__ import annotations

import httpx


async def fetch_with_timeout(
    url: str,
    params: dict | None = None,
    timeout_seconds: float = 12.0
) -> httpx.Response:
    """Performs an async GET request with custom headers, redirects enabled, and strict timeout."""
    headers = {
        "User-Agent": "CuraLink Medical Research Assistant prototype"
    }

    # Enable follow_redirects=True so 301/302 redirects don't return raw HTML
    async with httpx.AsyncClient(
        timeout=timeout_seconds, 
        headers=headers, 
        follow_redirects=True
    ) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response