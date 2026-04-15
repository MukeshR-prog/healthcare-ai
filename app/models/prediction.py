from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class Prediction(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    claim_id: str
    prediction: int
    confidence: float
    explanation: str
    summary: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
