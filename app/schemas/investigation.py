from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TimelineItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(alias="event_type")
    desc: str = Field(alias="description")
    date: datetime = Field(alias="created_at")
    status: str = "New"


class NoteItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    analyst: str = Field(alias="author")
    text: str = Field(alias="note")
    date: datetime = Field(alias="created_at")


class InvestigationResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

    id: str = Field(alias="id")
    case_id: str
    alert_id: str
    claim_id: str
    provider: str
    amount: float = Field(alias="claim_amount")
    riskScore: float = Field(alias="risk_score")
    severity: str
    status: str
    priority: str
    assignedTo: str = Field(alias="assigned_to")
    created_at: datetime
    updated_at: datetime
    created_by: str
    notes: list[NoteItemSchema] = []
    timeline: list[TimelineItemSchema] = []


class InvestigationCreate(BaseModel):
    alert_id: str
    assigned_to: str = "Unassigned"
    priority: str = "Medium"


class InvestigationStatusUpdate(BaseModel):
    status: str
    description: str | None = None


class InvestigationAssignmentUpdate(BaseModel):
    assigned_to: str
    priority: str


class InvestigationNoteCreate(BaseModel):
    note: str = Field(alias="text")

    model_config = ConfigDict(populate_by_name=True)


class InvestigationTimelineResponse(BaseModel):
    case_id: str
    events: list[TimelineItemSchema]


class InvestigationListResponse(BaseModel):
    total: int
    items: list[InvestigationResponse]


class InvestigationMetricsResponse(BaseModel):
    total: int
    open: int
    review: int
    resolved: int
