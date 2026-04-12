from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def summarize(text):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a healthcare data analyst. Always summarize medical claims clearly and confidently."
            },
            {
                "role": "user",
                "content": f"""
Summarize the following medical claim in 2-3 lines.

Extract:
- Procedure
- Cost
- Key detail

Medical Claim:
{text}
"""
            }
        ]
    )
    
    return response.choices[0].message.content