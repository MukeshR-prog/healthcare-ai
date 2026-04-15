from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class Claim(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    user_id: str | None = None
    provider: str
    age: int
    claim_amount: float
    num_procedures: int
    gender: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
