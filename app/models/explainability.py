from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class Explanation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    prediction_id: str
    claim_id: str
    risk_score: float
    fraud_probability: float
    confidence_score: float
    risk_level: str  # Low | Medium | High | Critical
    explanation_version: int = 1
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_features: dict

class FeatureContribution(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    prediction_id: str
    feature_name: str
    feature_value: str
    contribution_score: float
    direction: str  # positive | negative
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PredictionInsight(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    prediction_id: str
    summary: str
    recommendations: list[str]
    risk_factors: list[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
