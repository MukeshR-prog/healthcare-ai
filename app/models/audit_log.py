from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class AuditLog(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    action_type: str  # ALERT_CREATED, ALERT_STATUS_CHANGED, ALERT_NOTE_ADDED, ALERT_DELETED
    target_id: str
    operator_email: str
