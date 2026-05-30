from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class Investigation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    case_id: str
    alert_id: str
    claim_id: str
    provider: str
    claim_amount: float
    risk_score: float
    severity: str
    status: str = "New"  # New, Under Review, Investigating, Escalated, Confirmed Fraud, Closed
    priority: str = "Medium"  # Critical, High, Medium, Low
    assigned_to: str = "Unassigned"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "system"


class InvestigationNote(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    case_id: str  # References Investigation ObjectId as string
    author: str
    note: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestigationTimeline(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    case_id: str  # References Investigation ObjectId as string
    event_type: str  # CASE_CREATED, STATUS_CHANGED, ASSIGNMENT_CHANGED, NOTE_ADDED, PRIORITY_CHANGED, CASE_CLOSED
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "system"
