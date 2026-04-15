from datetime import datetime, timezone
import csv
import io

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError
from pymongo.database import Database

from app.db.connection import get_database
from app.models.claim import Claim
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.schemas.claim import ClaimCreate
from app.schemas.history import (
    HistoryClaim,
    HistoryDetailResponse,
    HistoryItem,
    HistoryListResponse,
    HistoryPrediction,
)
from app.services.auth_service import (
    create_access_token,
    create_reset_token,
    decode_token,
    encrypt_raw_password,
    get_current_user,
    hash_password,
    verify_password,
)
from app.services.llm_service import explain_fraud, summarize
from app.services.ml_service import (
    HIGH_RISK_CONFIDENCE_THRESHOLD,
    get_model_metrics,
    predict_fraud,
)

router = APIRouter()


def save_claim(db: Database, claim_input: ClaimCreate, user_id: str | None = None) -> str:
    claim_doc = Claim(**claim_input.to_db_payload(), user_id=user_id)
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


@router.post("/register", response_model=AuthResponse)
def register_user(payload: RegisterRequest, db: Database = Depends(get_database)):
    existing = db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = User(
        email=payload.email,
        password=hash_password(payload.password),
        rawpassword=encrypt_raw_password(payload.password),
    )
    user_payload = user_doc.model_dump(by_alias=True, exclude={"id"})
    result = db["users"].insert_one(user_payload)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id=user_id, email=payload.email)

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=payload.email,
    )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Database = Depends(get_database)):
    user_doc = db["users"].find_one({"email": payload.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user_doc["_id"])
    token = create_access_token(user_id=user_id, email=user_doc["email"])

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=user_doc["email"],
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Database = Depends(get_database)):
    user_doc = db["users"].find_one({"email": payload.email})
    if not user_doc:
        return ForgotPasswordResponse(message="If the account exists, a reset link has been sent")

    reset_token = create_reset_token(user_id=str(user_doc["_id"]), email=user_doc["email"])
    return ForgotPasswordResponse(
        message="Reset token generated",
        reset_token=reset_token,
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Database = Depends(get_database)):
    token_payload = decode_token(payload.token)
    if token_payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user_id = token_payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid reset token subject")

    update_result = db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password": hash_password(payload.new_password),
                "rawpassword": encrypt_raw_password(payload.new_password),
            }
        },
    )
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return MessageResponse(message="Password reset successful")

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
def analyze_claim(
    data: ClaimCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
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

    claim_id = save_claim(db, data, user_id=current_user["id"])
    prediction_id = save_prediction(
        db,
        claim_id=claim_id,
        prediction_value=ml_result["prediction"],
        confidence=ml_result["confidence"],
        explanation=explanation,
        summary=summary,
        user_id=current_user["id"],
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


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        decoded_content = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc

    reader = csv.DictReader(io.StringIO(decoded_content))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV header row is missing")

    results = []
    for row_index, row in enumerate(reader, start=2):
        try:
            claim_input = ClaimCreate(**row)
        except ValidationError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid row at line {row_index}: {exc.errors()}",
            ) from exc

        ml_input = claim_input.to_ml_payload()
        prediction_result = predict_fraud(ml_input)

        claim_id = save_claim(db, claim_input, user_id=current_user["id"])
        prediction_id = save_prediction(
            db,
            claim_id=claim_id,
            prediction_value=prediction_result["prediction"],
            confidence=prediction_result["confidence"],
            explanation="",
            summary="",
            user_id=current_user["id"],
        )

        results.append(
            {
                "fraud_prediction": prediction_result["prediction"],
                "confidence": prediction_result["confidence"],
                "claim_id": claim_id,
                "prediction_id": prediction_id,
            }
        )

    return {"results": results}


@router.get("/model-metrics")
def model_metrics():
    return get_model_metrics()

@router.get("/analytics")
def analytics(db: Database = Depends(get_database)):
    total_claims = db["claims"].count_documents({})

    avg_pipeline = [
        {"$group": {"_id": None, "avg_claim_amount": {"$avg": "$claim_amount"}}}
    ]
    avg_result = list(db["claims"].aggregate(avg_pipeline))
    avg_claim_amount = float(avg_result[0]["avg_claim_amount"]) if avg_result else 0.0

    fraud_cases = db["predictions"].count_documents({"prediction": 1})
    non_fraud_cases = max(0, total_claims - fraud_cases)
    fraud_rate_pct = (float(fraud_cases) / float(total_claims) * 100.0) if total_claims else 0.0

    provider_pipeline = [
        {
            "$group": {
                "_id": "$provider",
                "avg_claim_amount": {"$avg": "$claim_amount"},
                "claims_count": {"$sum": 1},
            }
        },
        {"$sort": {"avg_claim_amount": -1}},
    ]
    provider_rows = list(db["claims"].aggregate(provider_pipeline))
    avg_claim_by_provider = [
        {
            "provider": row["_id"],
            "avg_claim_amount": float(row["avg_claim_amount"]),
            "claims_count": int(row["claims_count"]),
        }
        for row in provider_rows
    ]

    gender_pipeline = [
        {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    gender_rows = list(db["claims"].aggregate(gender_pipeline))
    gender_distribution = [
        {
            "gender": row["_id"],
            "count": int(row["count"]),
            "percentage": (float(row["count"]) / float(total_claims) * 100.0) if total_claims else 0.0,
        }
        for row in gender_rows
    ]

    high_risk_claims_count = db["predictions"].count_documents(
        {
            "prediction": 1,
            "confidence": {"$gte": HIGH_RISK_CONFIDENCE_THRESHOLD},
        }
    )

    return {
        "total_claims": int(total_claims),
        "avg_claim_amount": avg_claim_amount,
        "fraud_cases": int(fraud_cases),
        "summary": {
            "total_claims": int(total_claims),
            "avg_claim_amount": avg_claim_amount,
            "fraud_cases": int(fraud_cases),
            "non_fraud_cases": int(non_fraud_cases),
            "fraud_rate_pct": fraud_rate_pct,
            "high_risk_claims_count": int(high_risk_claims_count),
            "high_risk_threshold": HIGH_RISK_CONFIDENCE_THRESHOLD,
        },
        "charts": {
            "average_claim_by_provider": avg_claim_by_provider,
            "gender_distribution": gender_distribution,
            "fraud_breakdown": {
                "fraud_cases": int(fraud_cases),
                "non_fraud_cases": int(non_fraud_cases),
            },
        },
    }


@router.get("/history", response_model=HistoryListResponse)
def get_history(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        *_history_lookup_pipeline(),
        {"$sort": {"created_at": -1}},
    ]
    claim_docs = list(db["claims"].aggregate(pipeline))
    items = [_build_history_item(claim_doc) for claim_doc in claim_docs]
    return HistoryListResponse(total=len(items), items=items)


@router.get("/history/{id}", response_model=HistoryDetailResponse)
def get_history_by_id(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid claim id")

    pipeline = [
        {"$match": {"_id": ObjectId(id), "user_id": current_user["id"]}},
        *_history_lookup_pipeline(),
    ]
    claim_doc = next(db["claims"].aggregate(pipeline), None)
    if not claim_doc:
        raise HTTPException(status_code=404, detail="Claim not found")

    return HistoryDetailResponse(item=_build_history_item(claim_doc))