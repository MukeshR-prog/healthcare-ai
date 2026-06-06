import uuid
from datetime import datetime, timezone
from pymongo.database import Database

from app.models.copilot import CopilotConversation, CopilotMessage, CopilotInsight
from app.repositories.copilot_repository import CopilotRepository
from app.services.context_service import ContextService
from app.services.prompt_service import PromptService
from app.services.llm_provider_service import get_llm_provider
from app.services.audit_service import AuditService

class CopilotService:
    @staticmethod
    def classify_intent(query: str) -> str:
        q = query.lower()
        if "provider" in q or "compare" in q or "watchlist" in q:
            return "Provider Risk Analysis"
        elif "trend" in q or "anomalies" in q or "baseline" in q:
            return "Fraud Trend Analysis"
        elif "investigation" in q or "case" in q:
            return "Investigation Summary"
        elif "alert" in q:
            return "Alert Summary"
        elif "document" in q or "ocr" in q or "mismatch" in q:
            return "Document Verification Summary"
        elif "explain" in q or "shap" in q or "prediction" in q:
            return "Explainability Summary"
        elif "executive" in q or "report" in q:
            return "Executive Report Summary"
        elif "compliance" in q or "audit" in q:
            return "Compliance Summary"
        return "Fraud Trend Analysis"

    @classmethod
    def handle_chat(
        cls,
        db: Database,
        user_id: str,
        query: str,
        conversation_id: str | None = None
    ) -> tuple[str, CopilotMessage]:
        # 1. Resolve or create conversation
        is_new = False
        if not conversation_id:
            conversation_id = f"CP-{uuid.uuid4().hex[:6].upper()}"
            is_new = True
            
        conv = None
        if not is_new:
            conv_dict = CopilotRepository.get_conversation(db, conversation_id)
            if not conv_dict:
                is_new = True
            else:
                conv = CopilotConversation(**conv_dict)
                
        if is_new:
            title = query[:40] + "..." if len(query) > 40 else query
            conv = CopilotConversation(
                conversation_id=conversation_id,
                user_id=user_id,
                title=title,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            CopilotRepository.save_conversation(db, conv)
            
            # Log COPILOT_CHAT_STARTED
            AuditService.log_event(
                db=db,
                event_type="COPILOT_CHAT_STARTED",
                entity_type="COPILOT",
                entity_id=conversation_id,
                action="CREATE",
                description=f"AI Fraud Copilot session started: {title}.",
                performed_by=user_id
            )

        # 2. Persist user message
        user_message = CopilotMessage(
            conversation_id=conversation_id,
            sender="user",
            message=query,
            created_at=datetime.now(timezone.utc)
        )
        CopilotRepository.save_message(db, user_message)

        # Log COPILOT_PROMPT_SUBMITTED
        AuditService.log_event(
            db=db,
            event_type="COPILOT_PROMPT_SUBMITTED",
            entity_type="COPILOT",
            entity_id=conversation_id,
            action="CREATE",
            description=f"Prompt submitted: {query[:60]}...",
            performed_by=user_id,
            metadata={"query": query}
        )

        # 3. Build context & generate reply
        context = ContextService.build_copilot_context(db)
        intent = cls.classify_intent(query)
        prompt = PromptService.build_prompt(intent, context, query)
        
        provider = get_llm_provider()
        reply, recs, insight_data = provider.generate(prompt, context, query, intent)

        # 4. Persist assistant message
        assistant_message = CopilotMessage(
            conversation_id=conversation_id,
            sender="assistant",
            message=reply,
            created_at=datetime.now(timezone.utc),
            recommendations=recs,
            insight_data=insight_data
        )
        msg_id = CopilotRepository.save_message(db, assistant_message)
        assistant_message.id = msg_id

        # Log COPILOT_RESPONSE_GENERATED
        AuditService.log_event(
            db=db,
            event_type="COPILOT_RESPONSE_GENERATED",
            entity_type="COPILOT",
            entity_id=conversation_id,
            action="CREATE",
            description="AI Fraud Copilot response generated.",
            performed_by="system",
            metadata={"intent": intent}
        )

        # 5. Persist Copilot Insight if generated
        if insight_data:
            insight_type = insight_data.get("type", "General")
            insight = CopilotInsight(
                conversation_id=conversation_id,
                insight_type=insight_type,
                generated_at=datetime.now(timezone.utc)
            )
            CopilotRepository.save_insight(db, insight)

        # 6. Update conversation time
        db["copilot_conversations"].update_one(
            {"conversation_id": conversation_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )

        return conversation_id, assistant_message

    @staticmethod
    def get_conversations(db: Database, user_id: str) -> list[dict]:
        return CopilotRepository.get_conversations(db, user_id)

    @staticmethod
    def get_conversation_messages(db: Database, conversation_id: str) -> list[dict]:
        return CopilotRepository.get_messages(db, conversation_id)

    @staticmethod
    def delete_conversation(db: Database, conversation_id: str, user_id: str) -> bool:
        success = CopilotRepository.delete_conversation(db, conversation_id)
        if success:
            AuditService.log_event(
                db=db,
                event_type="COPILOT_CONVERSATION_DELETED",
                entity_type="COPILOT",
                entity_id=conversation_id,
                action="DELETE",
                description="Copilot chat session deleted.",
                performed_by=user_id
            )
        return success
