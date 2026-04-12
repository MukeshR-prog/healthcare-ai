import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    APP_NAME = "Healthcare AI System"
    VERSION = "1.0.0"

settings = Settings()