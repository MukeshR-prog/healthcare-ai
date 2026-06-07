# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.services.retrieval_service import RetrievalService
from app.services.llm_provider_service import get_llm_provider
from app.services.audit_service import AuditService

class RAGService:
    @classmethod
    def ask_question(cls, db: Database, question: str, limit: int = 5) -> dict:
        # 1. Retrieve context
        results = RetrievalService.retrieve_context(db, question, limit=limit)
        
        # 2. Assemble context prompt
        if results:
            context_str = "--- SEMANTIC RETRIEVED CONTEXT ---\n"
            for idx, r in enumerate(results):
                context_str += f"[{idx + 1}] Source: {r['source_type']} ({r['source_id']}) - {r['title']} (Confidence: {r['confidence_score']:.2f})\n"
                context_str += f"Content: {r['content']}\n\n"
            context_str += "----------------------------------\n\n"
            
            system_instruction = (
                "You are the Healthcare AI Fraud Copilot. "
                "Answer the user's question using the retrieved semantic context. "
                "Ensure your response is highly factual and uses the facts presented in the context. "
                "Always cite your sources by referencing their Source Type and Source ID (e.g. '[ocr_document (DOC-1001)]').\n\n"
            )
            
            prompt = f"{system_instruction}{context_str}Question: {question}\n\nAI Response:"
        else:
            # Fallback when no context found
            system_instruction = (
                "You are the Healthcare AI Fraud Copilot. "
                "No direct semantic matches were found in the knowledge base to answer the question. "
                "Answer to the best of your ability using general context or state that you could not find direct sources.\n\n"
            )
            prompt = f"{system_instruction}Question: {question}\n\nAI Response:"

        # 3. Call LLM provider
        provider = get_llm_provider()
        answer, _, _ = provider.generate(prompt, {}, question, "RAG Query")
        
        # Log RAG_QUERY_EXECUTED
        AuditService.log_event(
            db=db,
            event_type="RAG_QUERY_EXECUTED",
            entity_type="RAG",
            entity_id="KB-SYSTEM",
            action="READ",
            description=f"RAG query answered for: '{question[:40]}...'",
            performed_by="system",
            metadata={"query": question, "sources_count": len(results)}
        )
        
        return {
            "answer": answer,
            "sources": results
        }
