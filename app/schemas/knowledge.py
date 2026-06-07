from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, AliasChoices
from bson import ObjectId

def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

class RAGSearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    query: str
    limit: int | None = Field(default=5, alias="limit")

class RAGAskRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    question: str
    limit: int | None = Field(default=5, alias="limit")

class RAGCitation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str
    content: str
    source_type: str = Field(alias="sourceType", validation_alias=AliasChoices("sourceType", "source_type"))
    source_id: str = Field(alias="sourceId", validation_alias=AliasChoices("sourceId", "source_id"))
    confidence_score: float = Field(alias="confidenceScore", validation_alias=AliasChoices("confidenceScore", "confidence_score"))

class RAGSearchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    results: list[RAGCitation]

class RAGAskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    answer: str
    sources: list[RAGCitation] = Field(default_factory=list)

class RAGStatsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    documents: int
    chunks: int
    embeddings: int
