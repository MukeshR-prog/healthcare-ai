from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class Report(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    report_id: str
    report_type: str
    title: str
    generated_by: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "Completed"
    summary: str
    metrics: dict
    filters: dict
    cached: bool = True
    table_data: list[dict] = []
    charts_data: list[dict] = []

class ReportTemplate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    template_name: str
    report_type: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    description: str | None = None
    time_range: str = "Last 30 Days"

class ReportExport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    report_id: str
    export_type: str
    generated_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
