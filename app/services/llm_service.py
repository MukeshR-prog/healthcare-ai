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