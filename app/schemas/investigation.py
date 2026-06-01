from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, BeforeValidator, field_validator
from bson import ObjectId

# Helper to coerce MongoDB ObjectId to string
def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]


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

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
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
    updated_at: datetime | None = None
    created_by: str | None = None
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
    note: str = Field(alias="text", min_length=1, max_length=2000)

    @field_validator('note')
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Note cannot be empty or whitespace only')
        return v.strip()

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
