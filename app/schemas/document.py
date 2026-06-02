from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, BeforeValidator, field_validator
from bson import ObjectId

def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

class DocumentNoteSchema(BaseModel):
    text: str
    date: datetime
    analyst: str

class DocumentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    document_id: str
    file_name: str
    file_type: str
    file_size: str
    uploaded_by: str
    uploaded_at: datetime
    status: str
    notes: list[DocumentNoteSchema] = []

class OCRExtractionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    document_id: str
    patient_name: str | None
    provider_name: str | None
    claim_amount: float | None
    date_of_service: datetime | None
    diagnosis_code: str
    procedure_code: str
    confidence_score: float
    processed_at: datetime

class ChecksSchema(BaseModel):
    nameMatch: str
    providerMatch: str
    amountMatch: str
    dateMatch: str

class ClaimValuesSchema(BaseModel):
    patientName: str
    providerName: str
    claimAmount: float
    dateOfService: str

class VerificationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    document_id: str
    verification_score: int
    risk_level: str
    mismatch_count: int
    status: str
    checks: ChecksSchema
    claim_values: ClaimValuesSchema
    created_at: datetime

class UnifiedDocumentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="id", validation_alias=AliasChoices("id", "document_id"))
    file_name: str = Field(alias="fileName", validation_alias=AliasChoices("fileName", "file_name"))
    file_type: str = Field(alias="fileType", validation_alias=AliasChoices("fileType", "file_type"))
    file_size: str = Field(alias="fileSize", validation_alias=AliasChoices("fileSize", "file_size"))
    uploaded_by: str
    uploaded_at: datetime = Field(alias="created_at", validation_alias=AliasChoices("created_at", "uploaded_at"))
    status: str
    risk_level: str = Field(alias="riskLevel", validation_alias=AliasChoices("riskLevel", "risk_level"))
    patient_name: str | None = Field(default="", alias="patientName", validation_alias=AliasChoices("patientName", "patient_name"))
    provider_name: str | None = Field(default="", alias="providerName", validation_alias=AliasChoices("providerName", "provider_name"))
    claim_amount: float = Field(default=0.0, alias="claimAmount", validation_alias=AliasChoices("claimAmount", "claim_amount"))
    date_of_service: str = Field(default="", alias="dateOfService", validation_alias=AliasChoices("dateOfService", "date_of_service"))
    diagnosis_code: str = Field(default="", alias="diagnosisCode", validation_alias=AliasChoices("diagnosisCode", "diagnosis_code"))
    procedure_code: str = Field(default="", alias="procedureCode", validation_alias=AliasChoices("procedureCode", "procedure_code"))
    notes: list[DocumentNoteSchema] = []
    verification: VerificationResponse | None = None

class DocumentNoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

    @field_validator('text')
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Note cannot be empty or whitespace only')
        return v.strip()

class VerificationMetricsResponse(BaseModel):
    total: int
    verified: int
    flagged: int
    accuracy: float
