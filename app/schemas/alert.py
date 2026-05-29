from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AlertNoteSchema(BaseModel):
    text: str
    date: datetime
    analyst: str


class AlertResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="id")
    claim_id: str
    prediction_id: str
    provider: str
    claim_amount: float
    risk_score: float
    severity: str
    status: str
    notes: list[AlertNoteSchema] = []
    created_at: datetime
    updated_at: datetime
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
    text: str


class AlertListResponse(BaseModel):
    total: int
    items: list[AlertResponse]
