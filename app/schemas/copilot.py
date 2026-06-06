from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, AliasChoices
from bson import ObjectId

def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    conversation_id: str | None = Field(default=None, alias="conversationId")

class MessageResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    sender: str
    text: str = Field(alias="text", validation_alias=AliasChoices("text", "message"))
    timestamp: datetime = Field(alias="timestamp", validation_alias=AliasChoices("timestamp", "created_at"))
    is_pinned: bool = Field(default=False, alias="isPinned", validation_alias=AliasChoices("isPinned", "is_pinned"))
    recommendations: list[dict] = Field(default_factory=list)
    insight_data: dict = Field(default_factory=dict, alias="insightData", validation_alias=AliasChoices("insightData", "insight_data"))

class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    conversation_id: str = Field(alias="conversationId")
    response: MessageResponse

class ConversationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    conversation_id: str = Field(alias="conversationId", validation_alias=AliasChoices("conversationId", "conversation_id"))
    title: str
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: datetime = Field(alias="updatedAt", validation_alias=AliasChoices("updatedAt", "updated_at"))

class CopilotMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_queries: int = Field(alias="totalQueries")
    pinned_insights: int = Field(alias="pinnedInsights")
    open_investigations: int = Field(alias="openInvestigations")
    high_risk_alerts: int = Field(alias="highRiskAlerts")
