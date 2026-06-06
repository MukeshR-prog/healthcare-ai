from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import get_current_user
from app.schemas.investigation import (
    InvestigationResponse, InvestigationCreate, InvestigationStatusUpdate,
    InvestigationAssignmentUpdate, InvestigationNoteCreate, InvestigationListResponse,
    InvestigationMetricsResponse, NoteItemSchema, TimelineItemSchema
)
from app.services.investigation_service import InvestigationService
from app.repositories.investigation_repository import InvestigationRepository


router = APIRouter(prefix="/api/cases", tags=["investigations"])


@router.get("", response_model=InvestigationListResponse)
def get_cases_endpoint(
    search: str = Query(None),
    status: str = Query(None),
    priority: str = Query(None),
    assigned_to: str = Query(None, alias="assigned_to"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    sort_by: str = Query("created_at"),
    sort_dir: int = Query(-1),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    total, items = InvestigationRepository.get_cases(
        db, search=search, status=status, priority=priority,
        assigned_to=assigned_to, skip=skip, limit=limit,
        sort_by=sort_by, sort_dir=sort_dir
    )
    return {"total": total, "items": items}


@router.get("/metrics", response_model=InvestigationMetricsResponse)
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return InvestigationService.aggregate_metrics(db)


@router.get("/{id}", response_model=InvestigationResponse)
def get_case_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    case = InvestigationRepository.get_case_by_id(db, id)
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return case


@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_case_endpoint(
    payload: InvestigationCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    case_id = InvestigationService.create_case(
        db,
        alert_id=payload.alert_id,
        assigned_to=payload.assigned_to,
        priority=payload.priority,
        operator_email=current_user["email"]
    )
    case = InvestigationRepository.get_case_by_id(db, case_id)
    return case


@router.patch("/{id}/status", response_model=InvestigationResponse)
def update_status_endpoint(
    id: str,
    payload: InvestigationStatusUpdate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return InvestigationService.update_case_status(
        db,
        case_id=id,
        status=payload.status,
        description=payload.description,
        operator_email=current_user["email"]
    )


@router.patch("/{id}/assignment", response_model=InvestigationResponse)
def update_assignment_endpoint(
    id: str,
    payload: InvestigationAssignmentUpdate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return InvestigationService.update_case_assignment(
        db,
        case_id=id,
        assigned_to=payload.assigned_to,
        priority=payload.priority,
        operator_email=current_user["email"]
    )


@router.post("/{id}/notes", response_model=InvestigationResponse)
def add_note_endpoint(
    id: str,
    payload: InvestigationNoteCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return InvestigationService.add_note(
        db,
        case_id=id,
        text=payload.note,
        operator_email=current_user["email"]
    )


@router.get("/{id}/timeline", response_model=list[TimelineItemSchema])
def get_timeline_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    events = InvestigationRepository.get_timeline(db, id)
    # Map raw timeline documents to schema fields
    return [
        {
            "event_type": event["event_type"],
            "description": event["description"],
            "created_at": event["created_at"],
            "status": event.get("event_type", "New")
        }
        for event in events
    ]


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    InvestigationService.delete_case_and_log(db, case_id=id, operator_email=current_user["email"])
    return None
