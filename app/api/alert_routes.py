# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from pymongo.database import Database
from app.db.connection import get_database
from app.services.auth_service import get_current_user
from app.schemas.alert import (
    AlertResponse, AlertCreate, AlertUpdateStatus,
    AlertNoteCreate, AlertListResponse
)
from app.services.alert_service import AlertService
from app.repositories.alert_repository import AlertRepository


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=AlertListResponse)
def get_alerts_endpoint(
    search: str = Query(None),
    status: str = Query(None),
    severity: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    sort_by: str = Query("created_at"),
    sort_dir: int = Query(-1),
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    total, items = AlertRepository.get_alerts(
        db, search=search, status=status, severity=severity,
        skip=skip, limit=limit, sort_by=sort_by, sort_dir=sort_dir
    )
    return {"total": total, "items": items}


@router.get("/{id}", response_model=AlertResponse)
def get_alert_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    alert = AlertRepository.get_alert_by_id(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{id}/status", response_model=AlertResponse)
def update_status_endpoint(
    id: str,
    payload: AlertUpdateStatus,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return AlertService.update_alert_status(
        db, alert_id=id, status=payload.status, operator_email=current_user["email"]
    )


@router.post("/{id}/notes", response_model=AlertResponse)
def add_note_endpoint(
    id: str,
    payload: AlertNoteCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    return AlertService.create_note(
        db, alert_id=id, note_text=payload.text, operator_email=current_user["email"]
    )


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert_endpoint(
    payload: AlertCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    operator_email = current_user["email"]
    alert_id = AlertService.process_prediction_alert(
        db,
        claim_id=payload.claim_id,
        prediction_id=payload.prediction_id,
        provider=payload.provider,
        claim_amount=payload.claim_amount,
        risk_score=payload.risk_score,
        operator_email=operator_email
    )
    if not alert_id:
        raise HTTPException(status_code=400, detail="Alert already exists or creation failed")
    
    alert = AlertRepository.get_alert_by_id(db, alert_id)
    return alert


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_endpoint(
    id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    AlertService.delete_alert_and_log(db, alert_id=id, operator_email=current_user["email"])
