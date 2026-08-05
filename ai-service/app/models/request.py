from typing import Optional
from pydantic import Field
from .shared import BaseCamelModel, StructuredContext, ConversationContext

class AIRequest(BaseCamelModel):
    message: str = Field(..., min_length=1, description="The incoming chat message string")
    structured_context: Optional[StructuredContext] = Field(default=None, alias="structuredContent")
    conversation_context: Optional[ConversationContext] = Field(..., alias="conversationContext")
