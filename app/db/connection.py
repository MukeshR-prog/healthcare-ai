from typing import Generator

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

_mongo_client: MongoClient | None = None


def connect_to_mongo() -> None:
    """Initialize and cache a single MongoDB client for the app lifecycle."""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
        )


def close_mongo_connection() -> None:
    """Close the MongoDB client when the app shuts down."""
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None


def get_mongo_database() -> Database:
    if _mongo_client is None:
        connect_to_mongo()
    assert _mongo_client is not None
    return _mongo_client[settings.MONGO_DB_NAME]


def get_database() -> Generator[Database, None, None]:
    """Reusable FastAPI dependency that yields the configured database."""
    yield get_mongo_database()
