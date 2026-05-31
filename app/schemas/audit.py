from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AuditLogCreate(BaseModel):
    event_type: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    performed_by: str
    metadata: dict = Field(default_factory=dict)


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="id")
    event_type: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    performed_by: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class AuditLogListResponse(BaseModel):
    total: int
    items: list[AuditLogResponse]


class AuditMetricsResponse(BaseModel):
    total_events: int
    alert_actions: int
    investigation_actions: int
    provider_actions: int
    document_actions: int
