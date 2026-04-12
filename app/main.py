from fastapi import FastAPI
from app.llm import summarize

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/summarize")
def summarize_api(data: dict):
    text = data["text"]
    result = summarize(text)

    return {"summary": result}