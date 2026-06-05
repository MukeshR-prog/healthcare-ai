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
    version: int = 1
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
    description: str | None = "Default executive report"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    time_range: str = "Last 30 Days"

class ReportExport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    report_id: str
    export_type: str
    file_size: int = 0
    download_count: int = 0
    generated_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScheduledReport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    report_type: str
    frequency: str
    enabled: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
