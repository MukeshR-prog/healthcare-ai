from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.connection import get_database
from app.models.claim import Claim
from app.models.prediction import Prediction
from app.schemas.claim import ClaimCreate
from app.schemas.history import (
    HistoryClaim,
    HistoryDetailResponse,
    HistoryItem,
    HistoryListResponse,
    HistoryPrediction,
)
from app.services.llm_service import explain_fraud, summarize
from app.services.ml_service import predict_fraud

router = APIRouter()


def save_claim(db: Database, claim_input: ClaimCreate) -> str:
    claim_doc = Claim(**claim_input.to_db_payload())
    payload = claim_doc.model_dump(by_alias=True, exclude={"id"})
    result = db["claims"].insert_one(payload)
    return str(result.inserted_id)


def save_prediction(
    db: Database,
    claim_id: str,
    prediction_value: int,
    confidence: float,
    explanation: str,
    summary: str,
) -> str:
    prediction_doc = Prediction(
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


def _serialize_claim(claim_doc: dict) -> HistoryClaim:
    return HistoryClaim(
        id=str(claim_doc["_id"]),
        provider=claim_doc["provider"],
        age=int(claim_doc["age"]),
        claim_amount=float(claim_doc["claim_amount"]),
        num_procedures=int(claim_doc["num_procedures"]),
        gender=claim_doc["gender"],
        created_at=claim_doc["created_at"],
    )


def _serialize_prediction(prediction_doc: dict) -> HistoryPrediction:
    return HistoryPrediction(
        id=str(prediction_doc["_id"]),
        claim_id=prediction_doc["claim_id"],
        prediction=int(prediction_doc["prediction"]),
        confidence=float(prediction_doc["confidence"]),
        explanation=prediction_doc.get("explanation", ""),
        summary=prediction_doc.get("summary", ""),
        created_at=prediction_doc["created_at"],
    )


def _build_history_item(claim_doc: dict) -> HistoryItem:
    predictions = [_serialize_prediction(p) for p in claim_doc.get("predictions", [])]
    latest_prediction = predictions[0] if predictions else None
    return HistoryItem(
        claim=_serialize_claim(claim_doc),
        predictions=predictions,
        latest_prediction=latest_prediction,
    )


def _history_lookup_pipeline() -> list[dict]:
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

@router.get("/")
def home():
    return {"message": "Healthcare AI API Running"}

@router.post("/summarize")
def summarize_api(data: dict):
    return {"summary": summarize(data["text"])}

@router.post("/predict")
def predict_api(data: ClaimCreate, db: Database = Depends(get_database)):
    ml_input = data.to_ml_payload()
    prediction_result = predict_fraud(ml_input)

    claim_id = save_claim(db, data)
    prediction_id = save_prediction(
        db,
        claim_id=claim_id,
        prediction_value=prediction_result["prediction"],
        confidence=prediction_result["confidence"],
        explanation="",
        summary="",
    )

    return {
        "fraud_prediction": prediction_result,
        "claim_id": claim_id,
        "prediction_id": prediction_id,
    }

@router.post("/analyze")
def analyze_claim(data: ClaimCreate, db: Database = Depends(get_database)):
    ml_input = data.to_ml_payload()

    # ML prediction
    ml_result = predict_fraud(ml_input)

    # LLM explanation
    explanation = explain_fraud(
        ml_input,
        ml_result["prediction"],
        ml_result["confidence"]
    )

    # summary
    summary = summarize(str(ml_input))

    claim_id = save_claim(db, data)
    prediction_id = save_prediction(
        db,
        claim_id=claim_id,
        prediction_value=ml_result["prediction"],
        confidence=ml_result["confidence"],
        explanation=explanation,
        summary=summary,
    )

    return {
        "summary": summary,
        "fraud_prediction": ml_result["prediction"],
        "confidence": ml_result["confidence"],
        "explanation": explanation,
        "claim_id": claim_id,
        "prediction_id": prediction_id,
    }

@router.post("/batch-analyze")
def batch_analyze(data: list[ClaimCreate], db: Database = Depends(get_database)):
    results = []

    for claim in data:
        ml_input = claim.to_ml_payload()
        ml_result = predict_fraud(ml_input)

        claim_id = save_claim(db, claim)
        prediction_id = save_prediction(
            db,
            claim_id=claim_id,
            prediction_value=ml_result["prediction"],
            confidence=ml_result["confidence"],
            explanation="",
            summary="",
        )

        results.append(
            {
                **ml_result,
                "claim_id": claim_id,
                "prediction_id": prediction_id,
            }
        )

    return {"results": results}

@router.get("/analytics")
def analytics(db: Database = Depends(get_database)):
    total_claims = db["claims"].count_documents({})

    avg_pipeline = [
        {"$group": {"_id": None, "avg_claim_amount": {"$avg": "$claim_amount"}}}
    ]
    avg_result = list(db["claims"].aggregate(avg_pipeline))
    avg_claim_amount = float(avg_result[0]["avg_claim_amount"]) if avg_result else 0.0

    fraud_cases = db["predictions"].count_documents({"prediction": 1})

    return {
        "total_claims": int(total_claims),
        "avg_claim_amount": avg_claim_amount,
        "fraud_cases": int(fraud_cases),
    }


@router.get("/history", response_model=HistoryListResponse)
def get_history(db: Database = Depends(get_database)):
    pipeline = _history_lookup_pipeline() + [{"$sort": {"created_at": -1}}]
    claim_docs = list(db["claims"].aggregate(pipeline))
    items = [_build_history_item(claim_doc) for claim_doc in claim_docs]
    return HistoryListResponse(total=len(items), items=items)


@router.get("/history/{id}", response_model=HistoryDetailResponse)
def get_history_by_id(id: str, db: Database = Depends(get_database)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid claim id")

    pipeline = [
        {"$match": {"_id": ObjectId(id)}},
        *_history_lookup_pipeline(),
    ]
    claim_doc = next(db["claims"].aggregate(pipeline), None)
    if not claim_doc:
        raise HTTPException(status_code=404, detail="Claim not found")

    return HistoryDetailResponse(item=_build_history_item(claim_doc))