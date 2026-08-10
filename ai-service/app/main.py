from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Response, status
import os
from app.models.request import AIRequest
from app.services.chat_service import process_chat_request

app = FastAPI()

@app.get("/api/health")
async def health_check(response: Response):
    # Verify environment variables are present
    has_groq = bool(os.getenv("GROQ_API_KEY"))
    has_hf = bool(os.getenv("HF_TOKEN"))

    is_healthy = has_groq and has_hf

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "details": {
                "groq_configured": has_groq,
                "hf_configured": has_hf
            }
        }

    return {
        "status": "healthy",
        "service": "ai-service"
    }

@app.post("/api/chat")
async def internal_chat(request: AIRequest):
    result = await process_chat_request(request)
    return result;