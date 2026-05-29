from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class AlertNote(BaseModel):
    text: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    analyst: str


class Alert(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    claim_id: str
    prediction_id: str
    provider: str
    claim_amount: float
    risk_score: float
    severity: str  # Critical, High, Medium, Low
    status: str = "New"  # New, Under Review, Investigating, Resolved
    notes: list[AlertNote] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str | None = "system"
