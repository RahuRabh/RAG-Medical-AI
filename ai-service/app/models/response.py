from typing import Optional
from pydantic import Field
from shared import BaseCamelModel, StructuredContext, ConversationContext, AIOptions

class AIResponse(BaseCamelModel):
    answer: dict
    sources: list
    metadata: dict