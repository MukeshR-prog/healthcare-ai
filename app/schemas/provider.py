from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, BeforeValidator
from bson import ObjectId

# Helper to coerce MongoDB ObjectId to string
def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]


class ProviderResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    provider_id: str
    provider_name: str = Field(alias="name", validation_alias=AliasChoices("name", "provider_name"))
    provider_type: str
    location: str
    watchlist: bool = Field(alias="watchlist", validation_alias=AliasChoices("watchlist", "watchlisted"))
    flag: str = Field(alias="flag", validation_alias=AliasChoices("flag", "flag_reason"))
    created_at: datetime
    updated_at: datetime


class ProviderMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    provider_id: str
    provider_name: str = Field(alias="name", validation_alias=AliasChoices("name", "provider_name"))
    provider_type: str
    location: str
    watchlist: bool = Field(alias="watchlist", validation_alias=AliasChoices("watchlist", "watchlisted"))
    flag: str = Field(alias="flag", validation_alias=AliasChoices("flag", "flag_reason"))
    claimsCount: int
    totalClaimAmount: float
    avgClaimAmount: float
    fraudCount: int
    alertCount: int
    investigationCount: int
    resolvedCount: int
    riskScore: int
    riskLevel: str


class RiskTimelineEvent(BaseModel):
    date: datetime
    title: str
    desc: str
    type: str  # alert, case, resolution


class ProviderDetailResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId = Field(alias="id", validation_alias=AliasChoices("id", "_id"))
    provider_id: str
    provider_name: str = Field(alias="name", validation_alias=AliasChoices("name", "provider_name"))
    provider_type: str
    location: str
    watchlist: bool = Field(alias="watchlist", validation_alias=AliasChoices("watchlist", "watchlisted"))
    flag: str = Field(alias="flag", validation_alias=AliasChoices("flag", "flag_reason"))
    claimsCount: int
    totalClaimAmount: float
    avgClaimAmount: float
    fraudCount: int
    alertCount: int
    investigationCount: int
    resolvedCount: int
    riskScore: int
    riskLevel: str
    riskTimeline: list[RiskTimelineEvent] = []


class ProviderFlagUpdate(BaseModel):
    flag: str


class ProviderWatchlistUpdate(BaseModel):
    watchlist: bool


class ProviderComparisonRequest(BaseModel):
    names: list[str]

