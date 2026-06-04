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
    generated_by: str = Field(alias="generatedBy", validation_alias=AliasChoices("generatedBy", "generated_by"))
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))
