from groq import Groq
from app.core.config import settings
from dotenv import load_dotenv

client = Groq(api_key=settings.GROQ_API_KEY)

def summarize(text):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a healthcare analyst."},
            {"role": "user", "content": f"Summarize this claim: {text}"}
        ]
    )
    return response.choices[0].message.content

def explain_fraud(data, prediction, confidence):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a healthcare fraud analyst."
            },
            {
                "role": "user",
                "content": f"""
Claim Data:
{data}

Prediction: {prediction}
Confidence: {confidence}

Explain why this claim might be fraud in simple terms.
"""
            }
        ]
    )

    return response.choices[0].message.content