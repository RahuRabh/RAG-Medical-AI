from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI

from app.models.request import AIRequest
from app.services.chat_service import process_chat_request

app = FastAPI()

@app.post("/api/chat")
async def internal_chat(request: AIRequest):
    result = await process_chat_request(request)
    return result;