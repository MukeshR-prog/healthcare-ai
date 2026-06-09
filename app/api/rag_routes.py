# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database

from app.db.connection import get_database
from app.services.auth_service import require_roles
from app.schemas.knowledge import (
    RAGSearchRequest,
    RAGSearchResponse,
    RAGAskRequest,
    RAGAskResponse,
    RAGStatsResponse
)
from app.services.indexing_service import IndexingService
from app.services.retrieval_service import RetrievalService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/rag", tags=["rag"])

all_roles_dependency = Depends(require_roles(["Analyst", "Senior Analyst", "Auditor", "Admin"]))
admin_role_dependency = Depends(require_roles(["Admin"]))

@router.post("/search", response_model=RAGSearchResponse, status_code=status.HTTP_200_OK)
def search_endpoint(
    payload: RAGSearchRequest,
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    results = RetrievalService.retrieve_context(db, payload.query, limit=payload.limit or 5)
    return {"results": results}

@router.post("/ask", response_model=RAGAskResponse, status_code=status.HTTP_200_OK)
def ask_endpoint(
    payload: RAGAskRequest,
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    res = RAGService.ask_question(db, payload.question, limit=payload.limit or 5)
    return res

@router.post("/reindex", response_model=RAGStatsResponse, status_code=status.HTTP_200_OK)
def reindex_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = admin_role_dependency
):
    operator_email = current_user.get("email", "admin")
    stats = IndexingService.reindex_all(db, operator_email=operator_email)
    return stats

@router.get("/stats", response_model=RAGStatsResponse, status_code=status.HTTP_200_OK)
def get_stats_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    documents = db["knowledge_documents"].count_documents({})
    chunks = db["knowledge_chunks"].count_documents({})
    embeddings = db["embeddings"].count_documents({})
    return {
        "documents": documents,
        "chunks": chunks,
        "embeddings": embeddings
    }
