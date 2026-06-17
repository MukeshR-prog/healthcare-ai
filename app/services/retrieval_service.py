from datetime import datetime, timezone
from bson import ObjectId
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.services.embedding_service import get_embedding_provider
from app.vectorstore.vector_provider import get_vector_provider
from app.services.audit_service import AuditService

class RetrievalService:
    @staticmethod
    def retrieve_context(db: Database, query: str, limit: int = 5) -> list[dict]:
        embed_prov = get_embedding_provider()
        vector_store = get_vector_provider()
        
        # 1. Generate query vector
        query_vector = embed_prov.embed_query(query)
        
        # 2. Search vector store
        search_results = vector_store.search(query_vector, limit=limit)
        
        results = []
        for chunk_id, score in search_results:
            # Fetch knowledge chunk
            q_chunk = {}
            if ObjectId.is_valid(chunk_id):
                q_chunk["_id"] = ObjectId(chunk_id)
            else:
                q_chunk["id"] = chunk_id
                
            chunk_doc = db["knowledge_chunks"].find_one(q_chunk)
            if not chunk_doc:
                continue
                
            # Fetch parent document
            doc_id = chunk_doc["document_id"]
            doc_info = db["knowledge_documents"].find_one({"document_id": doc_id})
            if not doc_info:
                continue
                
            results.append({
                "title": doc_info.get("title", "Indexed Knowledge"),
                "content": chunk_doc.get("content", ""),
                "source_type": doc_info.get("source_type", "unknown"),
                "source_id": doc_info.get("source_id", ""),
                "confidence_score": score
            })
            
        # Log SEMANTIC_SEARCH_EXECUTED
        AuditService.log_event(
            db=db,
            event_type="SEMANTIC_SEARCH_EXECUTED",
            entity_type="RAG",
            entity_id="KB-SYSTEM",
            action="READ",
            description=f"Semantic search queried: '{query[:40]}...'. Found {len(results)} chunks.",
            performed_by="system",
            metadata={"query": query, "results_count": len(results)}
        )
        
        return results
