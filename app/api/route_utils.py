from datetime import datetime, timezone

from app.models.claim import Claim
from app.models.prediction import Prediction
from app.schemas.claim import ClaimCreate
from app.schemas.history import HistoryClaim, HistoryItem, HistoryPrediction


def save_claim(db, claim_input: ClaimCreate, user_id: str | None = None) -> str:
    claim_doc = Claim(**claim_input.to_db_payload(), user_id=user_id)
    payload = claim_doc.model_dump(by_alias=True, exclude={"id"})
    result = db["claims"].insert_one(payload)
    return str(result.inserted_id)


def save_prediction(
    db,
    claim_id: str,
    prediction_value: int,
    confidence: float,
    explanation: str,
    summary: str,
    user_id: str | None = None,
) -> str:
    prediction_doc = Prediction(
        user_id=user_id,
        claim_id=claim_id,
        prediction=prediction_value,
        confidence=confidence,
        explanation=explanation,
        summary=summary,
        created_at=datetime.now(timezone.utc),
    )
    payload = prediction_doc.model_dump(by_alias=True, exclude={"id"})
    result = db["predictions"].insert_one(payload)
    return str(result.inserted_id)


def serialize_claim(claim_doc: dict) -> HistoryClaim:
    return HistoryClaim(
        id=str(claim_doc["_id"]),
        provider=claim_doc["provider"],
        age=int(claim_doc["age"]),
        claim_amount=float(claim_doc["claim_amount"]),
        num_procedures=int(claim_doc["num_procedures"]),
        gender=claim_doc["gender"],
        created_at=claim_doc["created_at"],
    )


def serialize_prediction(prediction_doc: dict) -> HistoryPrediction:
    return HistoryPrediction(
        id=str(prediction_doc["_id"]),
        claim_id=prediction_doc["claim_id"],
        prediction=int(prediction_doc["prediction"]),
        confidence=float(prediction_doc["confidence"]),
        explanation=prediction_doc.get("explanation", ""),
        summary=prediction_doc.get("summary", ""),
        created_at=prediction_doc["created_at"],
    )


def build_history_item(claim_doc: dict) -> HistoryItem:
    predictions = [serialize_prediction(p) for p in claim_doc.get("predictions", [])]
    latest_prediction = predictions[0] if predictions else None
    return HistoryItem(
        claim=serialize_claim(claim_doc),
        predictions=predictions,
        latest_prediction=latest_prediction,
    )


def history_lookup_pipeline() -> list[dict]:
    return [
        {
            "$lookup": {
                "from": "predictions",
                "let": {"claim_id_str": {"$toString": "$_id"}},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$eq": ["$claim_id", "$$claim_id_str"]
                            }
                        }
                    },
                    {"$sort": {"created_at": -1}},
                ],
                "as": "predictions",
            }
        }
    ]
