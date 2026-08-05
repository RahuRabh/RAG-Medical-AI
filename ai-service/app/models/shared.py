from typing import Optional
from pydantic import BaseModel, Field

class BaseCamelModel(BaseModel):
    model_config = {
        "populate_by_name": True,
    }

class StructuredContext(BaseCamelModel):
    patient_name: Optional[str] = Field(None, alias="patientName")
    disease: Optional[str] = None
    intent: Optional[str] = None
    location: Optional[str] = None

class ConversationContext(BaseCamelModel):
    patient_name: Optional[str] = Field(None, alias="patientName")
    active_disease: Optional[str] = Field(None, alias="activeDisease")
    active_intent: Optional[str] = Field(None, alias="activeIntent")
    active_location: Optional[str] = Field(None, alias="activeLocation")
