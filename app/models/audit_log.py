from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class AuditLog(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    event_type: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    performed_by: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
