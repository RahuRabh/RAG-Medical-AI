from models.request import AIRequest
from .understand_query import understand_query

async def process_chat_request(request: AIRequest):

    structured_ctx_dict = (
        request.structured_context.model_dump() 
        if request.structured_context else {}
    )
    
    conversation_ctx_dict = request.conversation_context.model_dump()

    query_analysis = await understand_query(
        message=request.message,
        structured_context=structured_ctx_dict,
        conversation_context=conversation_ctx_dict
    )

    return {
        "status": "success",
        "extracted_context": query_analysis,
        "original_message": request.message,
    }