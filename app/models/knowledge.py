from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

class KnowledgeDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    document_id: str
    source_type: str
    source_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KnowledgeChunk(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    document_id: str
    chunk_index: int
    content: str
    embedding_status: str = "pending"  # pending, indexed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChunkEmbedding(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    chunk_id: str
    vector_provider: str
    embedding_dimension: int
    vector: list[float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
