import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "healthcare_ai")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-dev-secret")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
    RAW_PASSWORD_ENCRYPTION_KEY = os.getenv("RAW_PASSWORD_ENCRYPTION_KEY", "")
    APP_NAME = "Healthcare AI System"
    VERSION = "1.0.0"

settings = Settings()