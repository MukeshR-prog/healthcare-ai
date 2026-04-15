from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    email: str
    password: str
    rawpassword: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
