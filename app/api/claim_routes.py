import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError
from pymongo.database import Database

from app.api.route_utils import save_claim, save_prediction
from app.db.connection import get_database
from app.schemas.claim import ClaimCreate
from app.services.auth_service import get_current_user
from app.services.llm_service import explain_fraud, summarize
from app.services.ml_service import predict_fraud

router = APIRouter()


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

    ml_result = predict_fraud(ml_input)

    explanation = explain_fraud(
        ml_input,
        ml_result["prediction"],
        ml_result["confidence"],
    )

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
        "anomaly_score": ml_result["anomaly_score"],
        "is_anomalous": ml_result["is_anomalous"],
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
