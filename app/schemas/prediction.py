from pydantic import BaseModel


class PredictionCreate(BaseModel):
    claim_id: str
    prediction: int
    confidence: float
    explanation: str
    summary: str
