from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk, ChunkEmbedding
from app.repositories.knowledge_repository import KnowledgeRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import get_embedding_provider
from app.vectorstore.vector_provider import get_vector_provider
from app.services.audit_service import AuditService

class IndexingService:
    @classmethod
    def reindex_all(cls, db: Database, operator_email: str = "system") -> dict:
        # Clear database and local FAISS indices
        KnowledgeRepository.clear_knowledge_base(db)
        
        # Clear file-system FAISS index (if file exists)
        vector_store = get_vector_provider()
        if hasattr(vector_store, "vectors"):
            vector_store.vectors.clear()
            vector_store.save()
            if hasattr(vector_store, "_faiss_index"):
                vector_store._faiss_index = None

        # Build documents
        doc_count = cls.index_documents(db)
        rep_count = cls.index_reports(db)
        inv_count = cls.index_investigations(db)
        aud_count = cls.index_audit_logs(db)
        prv_count = cls.index_providers(db)
        exp_count = cls.index_explainability(db)
        
        total_docs = doc_count + rep_count + inv_count + aud_count + prv_count + exp_count
        
        # Count chunks and embeddings
        chunk_count = db["knowledge_chunks"].count_documents({})
        emb_count = db["embeddings"].count_documents({})

        AuditService.log_event(
            db=db,
            event_type="KNOWLEDGE_BASE_REINDEXED",
            entity_type="RAG",
            entity_id="KB-SYSTEM",
            action="CREATE",
            description=f"Knowledge base reindexed: {total_docs} docs, {chunk_count} chunks.",
            performed_by=operator_email
        )

        return {
            "documents": total_docs,
            "chunks": chunk_count,
            "embeddings": emb_count
        }

    @classmethod
    def _save_and_index_document(cls, db: Database, source_type: str, source_id: str, title: str, content: str) -> bool:
        if not content or not content.strip():
            return False
            
        doc_id = f"KB-{source_type[:3].upper()}-{source_id}"
        
        # Create knowledge document
        kb_doc = KnowledgeDocument(
            document_id=doc_id,
            source_type=source_type,
            source_id=source_id,
            title=title,
            content=content,
            created_at=datetime.now(timezone.utc)
        )
        KnowledgeRepository.create_knowledge_document(db, kb_doc)
        
        # Chunk text
        chunks = ChunkingService.chunk_text(content)
        embed_prov = get_embedding_provider()
        vector_store = get_vector_provider()
        
        for idx, chunk_text in enumerate(chunks):
            # Create knowledge chunk
            kb_chunk = KnowledgeChunk(
                document_id=doc_id,
                chunk_index=idx,
                content=chunk_text,
                embedding_status="pending",
                created_at=datetime.now(timezone.utc)
            )
            chunk_db_id = KnowledgeRepository.create_knowledge_chunk(db, kb_chunk)
            
            # Generate embedding vector
            vector = embed_prov.embed_query(chunk_text)
            
            # Save embedding
            embedding = ChunkEmbedding(
                chunk_id=chunk_db_id,
                vector_provider=os.getenv("RAG_EMBEDDING_PROVIDER", "SentenceTransformers"),
                embedding_dimension=len(vector),
                vector=vector,
                created_at=datetime.now(timezone.utc)
            )
            KnowledgeRepository.save_embedding(db, embedding)
            
            # Save to vector index
            vector_store.upsert(chunk_db_id, vector)
            
            # Update status to indexed
            KnowledgeRepository.update_chunk_status(db, chunk_db_id, "indexed")
            
        # Log audit log
        AuditService.log_event(
            db=db,
            event_type="KNOWLEDGE_DOCUMENT_INDEXED",
            entity_type="RAG",
            entity_id=doc_id,
            action="CREATE",
            description=f"Indexed document {title} into knowledge base.",
            performed_by="system"
        )
        return True

    @classmethod
    def index_documents(cls, db: Database) -> int:
        count = 0
        cursor = db["documents"].find({})
        for doc in cursor:
            doc_id = doc.get("document_id") or str(doc.get("_id"))
            file_name = doc.get("file_name", "document.pdf")
            
            # Fetch verification details if exists
            v_res = db["verification_results"].find_one({"document_id": doc_id})
            ocr_text = ""
            if v_res:
                claim_values = v_res.get("claim_values", {})
                ocr_text += f"OCR Extracted Details:\n"
                ocr_text += f"- Patient Name: {claim_values.get('patientName', 'N/A')}\n"
                ocr_text += f"- Provider Name: {claim_values.get('providerName', 'N/A')}\n"
                ocr_text += f"- Claim Amount: {claim_values.get('claimAmount', 'N/A')}\n"
                ocr_text += f"- Verification Score: {v_res.get('verification_score', 100)}%\n"
                ocr_text += f"- Mismatches Count: {v_res.get('mismatch_count', 0)}\n"
                
                checks = v_res.get("checks", {})
                ocr_text += f"- Name Match: {checks.get('nameMatch')}\n"
                ocr_text += f"- Provider Match: {checks.get('providerMatch')}\n"
                ocr_text += f"- Amount Match: {checks.get('amountMatch')}\n"
                ocr_text += f"- Date Match: {checks.get('dateMatch')}\n"
                
                if v_res.get("status") == "Mismatch":
                    ocr_text += f"- Discrepancy details: {v_res.get('discrepancy', 'No details')}\n"
            
            content = f"OCR Document Details:\nFile Name: {file_name}\nStatus: {doc.get('status')}\nRisk Level: {doc.get('risk_level')}\n{ocr_text}"
            if cls._save_and_index_document(db, "ocr_document", doc_id, f"OCR Document: {file_name}", content):
                count += 1
        return count

    @classmethod
    def index_reports(cls, db: Database) -> int:
        count = 0
        cursor = db["reports"].find({})
        for rep in cursor:
            rep_id = rep.get("report_id") or str(rep.get("_id"))
            title = rep.get("title", "Executive Report")
            content = (
                f"Executive Report Details:\n"
                f"Report ID: {rep_id}\n"
                f"Title: {title}\n"
                f"Report Type: {rep.get('report_type')}\n"
                f"Generated By: {rep.get('generated_by')}\n"
                f"Summary: {rep.get('summary') or 'No summary'}\n"
            )
            if cls._save_and_index_document(db, "report", rep_id, f"Report: {title}", content):
                count += 1
        return count

    @classmethod
    def index_investigations(cls, db: Database) -> int:
        count = 0
        cursor = db["investigations"].find({})
        for inv in cursor:
            case_db_id = str(inv.get("_id"))
            case_id = inv.get("case_id")
            provider = inv.get("provider", "Unknown Provider")
            
            # Fetch timeline events
            timeline_cursor = db["investigation_timeline"].find({"case_id": case_db_id})
            timeline_str = "\n".join([
                f"- [{t.get('created_at', '')}] {t.get('event_type')}: {t.get('description')}"
                for t in timeline_cursor
            ])
            
            # Fetch comments
            comments_cursor = db["investigation_notes"].find({"case_id": case_db_id})
            comments_str = "\n".join([
                f"- [{c.get('created_at', '')}] Analyst {c.get('author')}: {c.get('note')}"
                for c in comments_cursor
            ])
            
            content = (
                f"Investigation Details:\n"
                f"Case ID: {case_id}\n"
                f"Provider: {provider}\n"
                f"Claim Amount: ${inv.get('claim_amount', 0):,.2f}\n"
                f"Risk Score: {inv.get('risk_score', 0)}%\n"
                f"Severity: {inv.get('severity')}\n"
                f"Status: {inv.get('status')}\n"
                f"Priority: {inv.get('priority')}\n"
                f"Assigned To: {inv.get('assigned_to')}\n"
                f"Timeline Events:\n{timeline_str}\n"
                f"Analyst Comments:\n{comments_str}\n"
            )
            if cls._save_and_index_document(db, "investigation", case_id, f"Investigation: {case_id}", content):
                count += 1
        return count

    @classmethod
    def index_audit_logs(cls, db: Database) -> int:
        count = 0
        cursor = db["audit_logs"].find({}).sort("created_at", -1).limit(200) # Index last 200 logs
        for log in cursor:
            log_id = str(log.get("_id"))
            event_type = log.get("event_type", "AUDIT_EVENT")
            content = (
                f"Audit Log event:\n"
                f"Event Type: {event_type}\n"
                f"Entity: {log.get('entity_type')} ({log.get('entity_id')})\n"
                f"Action: {log.get('action')}\n"
                f"Description: {log.get('description')}\n"
                f"Performed By: {log.get('performed_by')}\n"
                f"Timestamp: {log.get('created_at')}\n"
            )
            if cls._save_and_index_document(db, "audit_log", log_id, f"Audit Log: {event_type}", content):
                count += 1
        return count

    @classmethod
    def index_providers(cls, db: Database) -> int:
        count = 0
        cursor = db["providers"].find({})
        for prov in cursor:
            prov_id = prov.get("provider_id") or str(prov.get("_id"))
            name = prov.get("provider_name", "Unknown Provider")
            watchlist_status = "Yes" if prov.get("watchlisted") else "No"
            
            content = (
                f"Provider Intelligence Profile:\n"
                f"Provider ID: {prov_id}\n"
                f"Provider Name: {name}\n"
                f"Risk Score: {prov.get('riskScore', prov.get('score', 0))}%\n"
                f"Total Claims: {prov.get('claimsCount', 0)}\n"
                f"Total Claim Amount: ${prov.get('totalClaimAmount', 0):,.2f}\n"
                f"Anomaly Flag Count: {prov.get('fraudCount', 0)}\n"
                f"Watchlisted: {watchlist_status}\n"
                f"Flags: {', '.join(prov.get('flags', []))}\n"
            )
            if cls._save_and_index_document(db, "provider_intelligence", prov_id, f"Provider Profile: {name}", content):
                count += 1
        return count

    @classmethod
    def index_explainability(cls, db: Database) -> int:
        count = 0
        cursor = db["explanations"].find({})
        for exp in cursor:
            exp_id = str(exp.get("_id"))
            pred_id = exp.get("prediction_id")
            
            # Fetch contributions
            contribs = list(db["feature_contributions"].find({"prediction_id": pred_id}))
            contrib_str = "\n".join([
                f"- Feature '{c.get('feature_name')}': Contribution={c.get('contribution', 0):+.4f} ({c.get('interpretation', '')})"
                for c in contribs
            ])
            
            # Fetch insights
            insight = db["prediction_insights"].find_one({"prediction_id": pred_id})
            rec_str = "No recommendations"
            factors_str = "No factors"
            if insight:
                rec_str = ", ".join(insight.get("recommendations", []))
                factors_str = ", ".join(insight.get("risk_factors", []))
                
            content = (
                f"Explainability Prediction Details:\n"
                f"Prediction ID: {pred_id}\n"
                f"Claim ID: {exp.get('claim_id')}\n"
                f"Risk Level: {exp.get('risk_level')}\n"
                f"Confidence Score: {exp.get('confidence_score', 0.0) * 100:.1f}%\n"
                f"Key Risk Factors: {factors_str}\n"
                f"Recommendations: {rec_str}\n"
                f"Feature SHAP Contributions:\n{contrib_str}\n"
            )
            if cls._save_and_index_document(db, "explainability", pred_id, f"Explainability: {pred_id}", content):
                count += 1
        return count
import os
