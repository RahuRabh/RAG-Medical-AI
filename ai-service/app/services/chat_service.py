from app.models.request import AIRequest
from app.services.understand_query import understand_query
from app.services.expand_query import expand_query
from app.services.retrieve_sources import retrieve_sources
from app.services.semantic import add_semantic_scores

async def process_chat_request(request: AIRequest):

    structured_ctx_dict = (
        request.structured_context.model_dump() 
        if request.structured_context else {}
    )
    
    conversation_ctx_dict = request.conversation_context.model_dump()

    understood_query = await understand_query(
        message=request.message,
        structured_context=structured_ctx_dict,
        conversation_context=conversation_ctx_dict
    )

    expanded_query = await expand_query(understood_query)

    retrieval = await retrieve_sources(
        expanded_query,
        understood_query
    )

    semantic_candidates = await add_semantic_scores(
        retrieval["candidates"] , 
        understood_query)

    return {
        "status": "success",
        "extracted_context": understood_query,
        "expanded_query": expanded_query,
        "original_message": request.message,
        # "retrieval": retrieval,
        "semantic_candidates": semantic_candidates
    }