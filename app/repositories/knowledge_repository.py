from bson import ObjectId
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk, ChunkEmbedding

class KnowledgeRepository:
    @staticmethod
    def create_knowledge_document(db: Database, doc: KnowledgeDocument) -> str:
        payload = doc.model_dump(by_alias=True, exclude={"id"})
        result = db["knowledge_documents"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def create_knowledge_chunk(db: Database, chunk: KnowledgeChunk) -> str:
        payload = chunk.model_dump(by_alias=True, exclude={"id"})
        result = db["knowledge_chunks"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_chunks_by_document(db: Database, document_id: str) -> list[dict]:
        cursor = db["knowledge_chunks"].find({"document_id": document_id})
        items = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            items.append(doc)
        return items

    @staticmethod
    def update_chunk_status(db: Database, chunk_id: str, status: str) -> bool:
        query = {}
        if ObjectId.is_valid(chunk_id):
            query["_id"] = ObjectId(chunk_id)
        else:
            query["id"] = chunk_id
            
        res = db["knowledge_chunks"].update_one(query, {"$set": {"embedding_status": status}})
        return res.modified_count > 0

    @staticmethod
    def save_embedding(db: Database, embedding: ChunkEmbedding) -> str:
        payload = embedding.model_dump(by_alias=True, exclude={"id"})
        # Prevent duplicates for the same chunk
        db["embeddings"].delete_many({"chunk_id": embedding.chunk_id})
        result = db["embeddings"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_all_chunks(db: Database) -> list[dict]:
        cursor = db["knowledge_chunks"].find({})
        items = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            items.append(doc)
        return items

    @staticmethod
    def clear_knowledge_base(db: Database) -> None:
        db["knowledge_documents"].delete_many({})
        db["knowledge_chunks"].delete_many({})
        db["embeddings"].delete_many({})
