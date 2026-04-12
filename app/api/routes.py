from fastapi import APIRouter
from app.services.ml_service import predict_fraud
from app.services.llm_service import summarize

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