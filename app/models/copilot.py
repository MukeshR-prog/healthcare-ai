from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class CopilotConversation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    conversation_id: str
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CopilotMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    conversation_id: str
    sender: str  # user | assistant
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_pinned: bool = False
    recommendations: list[dict] = []
    insight_data: dict = {}

class CopilotInsight(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    conversation_id: str
    insight_type: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
