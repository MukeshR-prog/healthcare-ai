from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class DocumentNote(BaseModel):
    text: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    analyst: str

class Document(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    document_id: str
    file_name: str
    file_type: str
    file_size: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    storage_path: str
    status: str = "Uploaded"  # Uploaded | Processing | Verified | Warning | Mismatch
    notes: list[DocumentNote] = Field(default_factory=list)

class OCRExtraction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    document_id: str
    patient_name: str | None = None
    provider_name: str | None = None
    claim_amount: float | None = None
    date_of_service: datetime | None = None
    diagnosis_code: str = ""
    procedure_code: str = ""
    confidence_score: float = 1.0
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VerificationResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    document_id: str
    verification_score: int  # 0-100
    risk_level: str  # Low | Medium | High
    mismatch_count: int
    status: str  # Verified | Warning | Mismatch
    checks: dict  # {"nameMatch": "verified|warning|mismatch", ...}
    claim_values: dict  # Mapped database claim values matched against
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
