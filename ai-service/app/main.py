from typing import Optional

from fastapi import FastAPI

from models.request import AIRequest
from services.chat_service import process_chat_request

app = FastAPI()

@app.post("/internal/chat")
async def internal_chat(request: AIRequest):
    result = await process_chat_request(request)
    return result;