from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, AliasChoices
from bson import ObjectId

def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

class ReportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    report_id: str = Field(alias="reportId", validation_alias=AliasChoices("reportId", "report_id"))
    report_type: str = Field(alias="reportType", validation_alias=AliasChoices("reportType", "report_type"))
    title: str
    generated_by: str = Field(alias="generatedBy", validation_alias=AliasChoices("generatedBy", "generated_by"))
    generated_at: datetime = Field(alias="generatedAt", validation_alias=AliasChoices("generatedAt", "generated_at"))
    status: str
    version: int
    summary: str
    metrics: dict
    filters: dict
    cached: bool
    table_data: list[dict] = Field(alias="tableData", validation_alias=AliasChoices("tableData", "table_data"))
    charts_data: list[dict] = Field(alias="chartsData", validation_alias=AliasChoices("chartsData", "charts_data"))

class ReportGenerateRequest(BaseModel):
    title: str
    report_type: str = Field(alias="reportType")
    time_range: str = Field(alias="timeRange")

class TemplateResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    title: str = Field(alias="title", validation_alias=AliasChoices("title", "template_name", "templateName"))
    type: str = Field(alias="type", validation_alias=AliasChoices("type", "report_type", "reportType"))
    created_by: str = Field(alias="createdBy", validation_alias=AliasChoices("createdBy", "created_by"))
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))
    desc: str | None = Field(alias="desc", validation_alias=AliasChoices("desc", "description"))
    time_range: str = Field(alias="timeRange", validation_alias=AliasChoices("timeRange", "time_range"))

class TemplateCreateRequest(BaseModel):
    title: str
    type: str
    time_range: str = Field(alias="timeRange")
    desc: str | None = None

class ComplianceMetricsResponse(BaseModel):
    compliance_score: float = Field(alias="complianceScore")
    category: str
    audit_coverage: float = Field(alias="auditCoverage")
    completion_rate: float = Field(alias="completionRate")
    verification_coverage: float = Field(alias="verificationCoverage")
    analyst_activity: int = Field(alias="analystActivity")

class ExportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    report_id: str = Field(alias="reportId", validation_alias=AliasChoices("reportId", "report_id"))
    export_type: str = Field(alias="exportType", validation_alias=AliasChoices("exportType", "export_type"))
    file_size: int = Field(alias="fileSize", validation_alias=AliasChoices("fileSize", "file_size"))
    download_count: int = Field(alias="downloadCount", validation_alias=AliasChoices("downloadCount", "download_count"))
    generated_by: str = Field(alias="generatedBy", validation_alias=AliasChoices("generatedBy", "generated_by"))
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))

class DashboardMetricsResponse(BaseModel):
    fraud_loss_estimate: float = Field(alias="fraud_loss_estimate")
    compliance_score: float = Field(alias="compliance_score")
    open_cases: int = Field(alias="open_cases")
    critical_alerts: int = Field(alias="critical_alerts")
    high_risk_providers: int = Field(alias="high_risk_providers")
    verification_success_rate: float = Field(alias="verification_success_rate")

class ScheduleResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    report_type: str = Field(alias="reportType", validation_alias=AliasChoices("reportType", "report_type"))
    frequency: str
    enabled: bool
    created_by: str = Field(alias="createdBy", validation_alias=AliasChoices("createdBy", "created_by"))
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))

class ScheduleCreateRequest(BaseModel):
    report_type: str = Field(alias="reportType")
    frequency: str
    enabled: bool = True
