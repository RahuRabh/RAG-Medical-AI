import re
from typing import Dict, Any, Optional
from models.request import AIRequest
# Converted regex patterns using Python's 're' module flags
FOLLOW_UP_PATTERNS = [
    re.compile(r"^what about\b", re.IGNORECASE),
    re.compile(r"^can i\b", re.IGNORECASE),
    re.compile(r"^is it\b", re.IGNORECASE),
    re.compile(r"^are there\b", re.IGNORECASE),
    re.compile(r"^any\b", re.IGNORECASE),
    re.compile(r"^side effects?\b", re.IGNORECASE),
    re.compile(r"^compare\b", re.IGNORECASE),
    re.compile(r"\bnear me\b", re.IGNORECASE),
    re.compile(r"\bthis treatment\b", re.IGNORECASE),
    re.compile(r"\bthis medication\b", re.IGNORECASE),
    re.compile(r"\bthese trials\b", re.IGNORECASE),
]

def clean(value: Optional[str]) -> str:
    """Helper function matching JavaScript's value?.trim() ?? ''"""
    if value is None:
        return ""
    return str(value).strip()

async def understand_query(
    message: str,
    structured_context: Optional[Dict[str, Any]],
    conversation_context: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyzes the user message alongside conversational memory and structured inputs
    to determine context, intent, and follow-up states.
    """
    # Defensive null-checking setup for dictionaries
    struct_ctx = structured_context or {}
    conv_ctx = conversation_context or {}

    original_message = clean(message)
    structured_disease = clean(struct_ctx.get("disease"))
    structured_intent = clean(struct_ctx.get("intent"))
    structured_location = clean(struct_ctx.get("location"))
    
    # Check if we have fresh incoming structured metadata
    has_fresh_structured_context = bool(structured_disease or structured_intent)

    # Evaluate regex matches against patterns array
    is_follow_up = (
        not has_fresh_structured_context and 
        any(pattern.search(original_message) for pattern in FOLLOW_UP_PATTERNS)
    )

    # ----------------------------------------------------
    # PLACEHOLDER: Semantic Fallback (Embeddings/Similarity)
    # Replaced as per your instruction.
    # ----------------------------------------------------
    # if not is_follow_up and conv_ctx.get("activeIntent"):
    #     is_follow_up = False 
    # ----------------------------------------------------

    # Resolve context state rules mirroring JavaScript evaluation cascade
    disease = (
        structured_disease or 
        (clean(conv_ctx.get("activeDisease")) if is_follow_up else "") or 
        clean(conv_ctx.get("activeDisease"))
    )
    
    intent = structured_intent or original_message or clean(conv_ctx.get("activeIntent"))
    
    location = (
        structured_location or 
        (clean(conv_ctx.get("activeLocation")) if is_follow_up else "") or 
        clean(conv_ctx.get("activeLocation"))
    )
    
    patient_name = clean(struct_ctx.get("patientName")) or clean(conv_ctx.get("patientName"))

    # Generate the combined search string safely filtering out empty components
    normalized_query_components = [intent, disease]
    normalized_query = " ".join([comp for comp in normalized_query_components if comp]).strip()
    
    if not normalized_query:
        normalized_query = original_message

    return {
        "patientName": patient_name,
        "disease": disease,
        "intent": intent,
        "location": location,
        "isFollowUp": is_follow_up,
        "originalMessage": original_message,
        "normalizedQuery": normalized_query,
    }
