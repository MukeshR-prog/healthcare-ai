from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, AliasChoices
from bson import ObjectId

def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

class ExplanationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    prediction_id: str = Field(alias="predictionId", validation_alias=AliasChoices("predictionId", "prediction_id"))
    claim_id: str = Field(alias="claimId", validation_alias=AliasChoices("claimId", "claim_id"))
    risk_score: float = Field(alias="riskScore", validation_alias=AliasChoices("riskScore", "risk_score"))
    fraud_probability: float = Field(alias="fraudProbability", validation_alias=AliasChoices("fraudProbability", "fraud_probability"))
    confidence_score: float = Field(alias="confidenceScore", validation_alias=AliasChoices("confidenceScore", "confidence_score"))
    risk_level: str = Field(alias="riskLevel", validation_alias=AliasChoices("riskLevel", "risk_level"))
    explanation_version: int = Field(alias="explanationVersion", validation_alias=AliasChoices("explanationVersion", "explanation_version"))
    generated_at: datetime = Field(alias="generatedAt", validation_alias=AliasChoices("generatedAt", "generated_at"))
    source_features: dict = Field(alias="sourceFeatures", validation_alias=AliasChoices("sourceFeatures", "source_features"))

class FeatureContributionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    prediction_id: str = Field(alias="predictionId", validation_alias=AliasChoices("predictionId", "prediction_id"))
    feature_name: str = Field(alias="featureName", validation_alias=AliasChoices("featureName", "feature_name"))
    feature_value: str = Field(alias="featureValue", validation_alias=AliasChoices("featureValue", "feature_value"))
    contribution_score: float = Field(alias="contributionScore", validation_alias=AliasChoices("contributionScore", "contribution_score"))
    direction: str
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))

class PredictionInsightResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    prediction_id: str = Field(alias="predictionId", validation_alias=AliasChoices("predictionId", "prediction_id"))
    summary: str
    recommendations: list[str]
    risk_factors: list[str] = Field(alias="riskFactors", validation_alias=AliasChoices("riskFactors", "risk_factors"))
    created_at: datetime = Field(alias="createdAt", validation_alias=AliasChoices("createdAt", "created_at"))

class ExplainabilityMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_explanations: int = Field(alias="totalExplanations", validation_alias=AliasChoices("totalExplanations", "total_explanations"))
    high_risk_predictions: int = Field(alias="highRiskPredictions", validation_alias=AliasChoices("highRiskPredictions", "high_risk_predictions"))
    avg_confidence_score: float = Field(alias="avgConfidenceScore", validation_alias=AliasChoices("avgConfidenceScore", "avg_confidence_score"))
    critical_predictions: int = Field(alias="criticalPredictions", validation_alias=AliasChoices("criticalPredictions", "critical_predictions"))
