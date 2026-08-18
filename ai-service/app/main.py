from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Response, status
import os
from app.models.request import AIRequest
from app.services.chat_service import process_chat_request
from app.core.redis import check_redis

app = FastAPI()

@app.get("/api/health")
async def health_check(response: Response):
    has_groq = bool(os.getenv("GROQ_API_KEY"))
    has_hf = bool(os.getenv("HF_TOKEN"))

    redis_healthy = False

    try:
        redis_healthy = await check_redis()
    except Exception:
        redis_healthy = False

    is_healthy = has_groq and has_hf and redis_healthy

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        return {
            "status": "unhealthy",
            "service": "ai-service",
            "details": {
                "groq_configured": has_groq,
                "hf_configured": has_hf,
                "redis_connected": redis_healthy,
            },
        }

    return {
        "status": "healthy",
        "service": "ai-service",
        "details": {
            "groq_configured": has_groq,
            "hf_configured": has_hf,
            "redis_connected": redis_healthy,
        },
    }

@app.post("/api/chat")
async def internal_chat(request: AIRequest):
    result = await process_chat_request(request)
    return result;