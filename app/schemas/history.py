from datetime import datetime

from pydantic import BaseModel


class HistoryClaim(BaseModel):
    id: str
    provider: str
    age: int
    claim_amount: float
    num_procedures: int
    gender: str
    created_at: datetime


class HistoryPrediction(BaseModel):
    id: str
    claim_id: str
    prediction: int
    confidence: float
    explanation: str
    summary: str
    created_at: datetime


class HistoryItem(BaseModel):
    claim: HistoryClaim
    predictions: list[HistoryPrediction]
    latest_prediction: HistoryPrediction | None = None


class HistoryListResponse(BaseModel):
    total: int
    items: list[HistoryItem]


class HistoryDetailResponse(BaseModel):
    item: HistoryItem
