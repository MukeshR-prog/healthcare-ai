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


class AlertNoteSchema(BaseModel):
    text: str
    date: datetime
    analyst: str


class AlertResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    claim_id: str
    prediction_id: str
    provider: str
    claim_amount: float
    risk_score: float
    severity: str
    status: str
    notes: list[AlertNoteSchema] = []
    created_at: datetime
    updated_at: datetime | None = None
    created_by: str | None = None
    
    # Frontend compatibility fields
    procedures: int = 1
    gender: str = "O"


class AlertCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    claim_id: str
    prediction_id: str
    provider: str
    claim_amount: float
    risk_score: float
    created_by: str | None = "system"


class AlertUpdateStatus(BaseModel):
    status: str


class AlertNoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

    @field_validator('text')
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Note cannot be empty or whitespace only')
        return v.strip()


class AlertListResponse(BaseModel):
    total: int
    items: list[AlertResponse]

