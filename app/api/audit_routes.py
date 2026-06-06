from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import require_roles
from app.schemas.audit import AuditLogResponse, AuditLogListResponse, AuditMetricsResponse
from app.repositories.audit_repository import AuditRepository


router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/logs", response_model=AuditLogListResponse)
def get_logs_endpoint(
    event_type: str = Query(None),
    entity_type: str = Query(None),
    performed_by: str = Query(None),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    sort_by: str = Query("created_at"),
    sort_dir: int = Query(-1),
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Admin", "Auditor", "Senior Analyst"]))
):
    total, items = AuditRepository.get_logs(
        db,
        event_type=event_type,
        entity_type=entity_type,
        performed_by=performed_by,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    return {"total": total, "items": items}


@router.get("/logs/{id}", response_model=AuditLogResponse)
def get_log_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Admin", "Auditor", "Senior Analyst"]))
):
    log = AuditRepository.get_log_by_id(db, id)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log


@router.get("/metrics", response_model=AuditMetricsResponse)
def get_metrics_endpoint(
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Admin", "Auditor", "Senior Analyst"]))
):
    return AuditRepository.get_metrics(db)


@router.get("/activity-feed", response_model=list[AuditLogResponse])
def get_activity_feed_endpoint(
    limit: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_database),
    current_user: dict = Depends(require_roles(["Admin", "Auditor", "Senior Analyst"]))
):
    _, items = AuditRepository.get_logs(
        db,
        limit=limit,
        sort_by="created_at",
        sort_dir=-1
    )
    return items
