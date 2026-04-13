from fastapi import APIRouter
from app.services.ml_service import predict_fraud
from app.services.llm_service import summarize, explain_fraud
router = APIRouter()

@router.get("/")
def home():
    return {"message": "Healthcare AI API Running"}

@router.post("/summarize")
def summarize_api(data: dict):
    return {"summary": summarize(data["text"])}

@router.post("/predict")
def predict_api(data: dict):
    return {"fraud_prediction": predict_fraud(data)}

@router.post("/analyze")
def analyze_claim(data: dict):
    # ML prediction
    ml_result = predict_fraud(data)

    # LLM explanation
    explanation = explain_fraud(
        data,
        ml_result["prediction"],
        ml_result["confidence"]
    )

    # summary
    summary = summarize(str(data))

    return {
        "summary": summary,
        "fraud_prediction": ml_result["prediction"],
        "confidence": ml_result["confidence"],
        "explanation": explanation
    }

@router.post("/batch-analyze")
def batch_analyze(data: list):
    results = []

    for claim in data:
        result = predict_fraud(claim)
        results.append(result)

    return {"results": results}


import pandas as pd

@router.get("/analytics")
def analytics():
    df = pd.read_csv("data/claims.csv")

    return {
        "total_claims": len(df),
        "avg_claim_amount": float(df["ClaimAmount"].mean()),
        "fraud_cases": int(df["Fraud"].sum())
    }