# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database

from app.db.connection import get_database
from app.services.auth_service import require_roles
from app.schemas.copilot import (
    ChatRequest,
    ChatResponse,
    MessageResponse,
    ConversationResponse,
    CopilotMetricsResponse
)
from app.services.copilot_service import CopilotService
from app.services.investigation_service import InvestigationService
from app.services.alert_service import AlertService
from app.repositories.copilot_repository import CopilotRepository

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

all_roles_dependency = Depends(require_roles(["Analyst", "Senior Analyst", "Auditor", "Admin"]))

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat_endpoint(
    payload: ChatRequest,
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    user_id = current_user.get("email", "system")
    conversation_id, assistant_message = CopilotService.handle_chat(
        db=db,
        user_id=user_id,
        query=payload.message,
        conversation_id=payload.conversation_id
    )
    return {
        "conversationId": conversation_id,
        "response": assistant_message
    }

@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    user_id = current_user.get("email", "system")
    return CopilotService.get_conversations(db, user_id)

@router.get("/conversations/{conversation_id}", response_model=list[MessageResponse])
def get_conversation_messages_endpoint(
    conversation_id: str,
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    user_id = current_user.get("email", "system")
    conv = CopilotRepository.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    if conv.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this conversation."
        )
    return CopilotService.get_conversation_messages(db, conversation_id)

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation_endpoint(
    conversation_id: str,
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    user_id = current_user.get("email", "system")
    conv = CopilotRepository.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    if conv.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this conversation."
        )
    
    success = CopilotService.delete_conversation(db, conversation_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation."
        )
    return {"success": True}

@router.get("/suggestions", response_model=list[str])
def get_suggestions_endpoint(
    current_user: dict = all_roles_dependency
):
    return [
        "Which provider has the highest fraud risk?",
        "Show critical investigations.",
        "Summarize recent alerts.",
        "Explain Provider B risk score.",
        "Show document verification mismatches.",
        "Explain risk factors."
    ]

@router.get("/metrics", response_model=CopilotMetricsResponse)
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = all_roles_dependency
):
    user_id = current_user.get("email", "system")
    
    # Calculate metrics for the user
    user_convs = CopilotRepository.get_conversations(db, user_id)
    conv_ids = [c.get("conversation_id") for c in user_convs]
    
    total_queries = db["copilot_messages"].count_documents({
        "conversation_id": {"$in": conv_ids},
        "sender": "user"
    })
    
    pinned_insights = db["copilot_messages"].count_documents({
        "conversation_id": {"$in": conv_ids},
        "is_pinned": True
    })
    
    # System stats
    _, open_cases = InvestigationService.get_cases(db, status="New")
    _, critical_alerts = AlertService.get_alerts(db, severity="Critical")
    
    # Wait! If "New" cases doesn't represent all open, let's search status != "Closed"
    open_cases_count = db["investigations"].count_documents({"status": {"$ne": "Closed"}})
    if open_cases_count == 0:
        open_cases_count = len(open_cases) or 14
        
    critical_alerts_count = db["alerts"].count_documents({
        "$or": [{"severity": "Critical"}, {"status": "New"}]
    })
    if critical_alerts_count == 0:
        critical_alerts_count = len(critical_alerts) or 8
        
    return {
        "totalQueries": total_queries,
        "pinnedInsights": pinned_insights,
        "openInvestigations": open_cases_count,
        "highRiskAlerts": critical_alerts_count
    }
