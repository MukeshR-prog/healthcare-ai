from fastapi import FastAPI
from app.llm import summarize
from app.model import predict_fraud

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/summarize")
def summarize_api(data: dict):
    return {"summary": summarize(data["text"])}

@app.post("/predict")
def predict_api(data: dict):
    result = predict_fraud(data)
    return {"fraud_prediction": result}