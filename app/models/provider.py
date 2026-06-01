from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field


class Provider(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    provider_id: str
    provider_name: str
    provider_type: str = Field(default="Healthcare Provider")
    location: str = Field(default="Global")
    watchlisted: bool = Field(default=False)
    flag_reason: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
