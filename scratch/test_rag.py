import os
import sys
from fastapi.testclient import TestClient

# Add workspace path to system path
sys.path.append(os.path.abspath("d:/ML/healthcare-ai"))

from app.main import app
from app.db.connection import connect_to_mongo, get_mongo_database, close_mongo_connection
from app.db.init_db import ensure_collections_and_indexes
from app.services.auth_service import get_current_user
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import get_embedding_provider
from app.vectorstore.vector_provider import get_vector_provider
from app.services.indexing_service import IndexingService
from app.services.retrieval_service import RetrievalService
from app.services.rag_service import RAGService

def test_rag_service():
    print("Connecting to MongoDB...")
    connect_to_mongo()
    db = get_mongo_database()
    
    print("Ensuring collections and indexes are initialized...")
    ensure_collections_and_indexes(db)
    
    user_id = "test_admin@platform.com"
    
    # 1. Test Chunking Service
    print("\n--- Test 1: Chunking Service ---")
    sample_text = (
        "This is a long clinical document about healthcare fraud anomalies. " * 20
    )
    chunks = ChunkingService.chunk_text(sample_text, chunk_size=300, overlap=50)
    assert len(chunks) > 1, f"Expected multiple chunks, got {len(chunks)}"
    for idx, c in enumerate(chunks):
        assert len(c) <= 350, f"Chunk {idx} is too large: {len(c)}"
        print(f"Chunk {idx + 1} size: {len(c)} characters.")
    print("Passed: Text split into overlapping chunks successfully.")
    
    # 2. Test Embedding Service (Fallback & Dimension)
    print("\n--- Test 2: Embedding Service ---")
    embed_prov = get_embedding_provider()
    dimension = embed_prov.get_dimension()
    print(f"Active Provider: {embed_prov.__class__.__name__} (Dimension: {dimension})")
    
    vec1 = embed_prov.embed_query("Query testing")
    assert len(vec1) == dimension, f"Expected vector length {dimension}, got {len(vec1)}"
    
    vecs = embed_prov.embed_documents(["Doc A", "Doc B"])
    assert len(vecs) == 2
    assert len(vecs[0]) == dimension
    print("Passed: Embedding generated correct dimensions.")
    
    # 3. Test Vector Store Provider
    print("\n--- Test 3: Vector Store Provider Flat Index ---")
    vector_store = get_vector_provider()
    print(f"Active Vector Store: {vector_store.__class__.__name__}")
    
    # Insert mock chunks
    chunk_a_id = "mock-chunk-a-123"
    chunk_b_id = "mock-chunk-b-456"
    vector_store.upsert(chunk_a_id, embed_prov.embed_query("Anomaly in upcoding billing codes"))
    vector_store.upsert(chunk_b_id, embed_prov.embed_query("Compliance audit logs report"))
    
    # Search
    search_q = embed_prov.embed_query("billing codes anomaly")
    res = vector_store.search(search_q, limit=2)
    assert len(res) >= 1
    assert res[0][0] == chunk_a_id, f"Expected best match {chunk_a_id}, got {res[0][0]}"
    assert res[0][1] > 0.0, f"Expected positive similarity score, got {res[0][1]}"
    print(f"Search results: {res}")
    
    # Delete mock
    vector_store.delete(chunk_a_id)
    vector_store.delete(chunk_b_id)
    print("Passed: Vector store CRUD operations and search rankings validated.")
    
    # 4. Test Indexing Pipeline
    print("\n--- Test 4: Database Reindexing Pipeline ---")
    # Clean database knowledge collections first
    db["knowledge_documents"].delete_many({})
    db["knowledge_chunks"].delete_many({})
    db["embeddings"].delete_many({})
    
    # Trigger full reindex
    stats = IndexingService.reindex_all(db, operator_email=user_id)
    assert isinstance(stats, dict)
    assert "documents" in stats
    assert "chunks" in stats
    assert "embeddings" in stats
    print(f"Reindexed collections successfully. Stats: {stats}")
    print("Passed: Reindexing pipeline completed.")
    
    # 5. Test Retrieval & RAG Services
    print("\n--- Test 5: Retrieval & RAG Services ---")
    retrieved = RetrievalService.retrieve_context(db, "provider risk analysis", limit=3)
    assert isinstance(retrieved, list)
    print(f"Retrieved context matches: {len(retrieved)}")
    
    rag_res = RAGService.ask_question(db, "Is Provider B high risk?", limit=3)
    assert isinstance(rag_res, dict)
    assert "answer" in rag_res
    assert "sources" in rag_res
    assert isinstance(rag_res["sources"], list)
    print(f"RAG Answer: {rag_res['answer'][:100]}...")
    print(f"RAG Citations Count: {len(rag_res['sources'])}")
    print("Passed: RAG answer generation and citations validated.")
    
    # 6. Test API Endpoints & RBAC
    print("\n--- Test 6: API Routes & RBAC Auth ---")
    client = TestClient(app)
    
    # Setup override for Admin role
    app.dependency_overrides[get_current_user] = lambda: {"email": user_id, "role": "Admin"}
    
    # Reindex endpoint
    response = client.post("/api/rag/reindex")
    assert response.status_code == 200, f"Reindex endpoint failed: {response.text}"
    stats_data = response.json()
    assert "documents" in stats_data
    print("Reindex API passed.")
    
    # Stats endpoint
    response = client.get("/api/rag/stats")
    assert response.status_code == 200
    stats_res = response.json()
    assert "documents" in stats_res
    print("Stats API passed.")
    
    # Search endpoint
    response = client.post("/api/rag/search", json={"query": "fraud risk", "limit": 2})
    assert response.status_code == 200
    search_res = response.json()
    assert "results" in search_res
    print("Search API passed.")
    
    # Ask endpoint
    response = client.post("/api/rag/ask", json={"question": "What is the baseline anomaly rate?", "limit": 2})
    assert response.status_code == 200
    ask_res = response.json()
    assert "answer" in ask_res
    assert "sources" in ask_res
    print("Ask API passed.")
    
    # Test Guest role restriction on reindex
    app.dependency_overrides[get_current_user] = lambda: {"email": "guest@platform.com", "role": "Analyst"}
    response = client.post("/api/rag/reindex")
    # Analyst role is not allowed on reindex (only Admin)
    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    print("RBAC route restrictions passed.")
    
    # Clean overrides and exit
    app.dependency_overrides.clear()
    close_mongo_connection()
    print("\nALL RAG PIPELINE & ROUTING TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_rag_service()
