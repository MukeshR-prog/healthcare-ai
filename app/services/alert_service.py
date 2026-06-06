from datetime import datetime, timezone
from fastapi import HTTPException
from pymongo.database import Database
from app.models.alert import Alert, AlertNote
from app.repositories.alert_repository import AlertRepository


class AlertService:
    @staticmethod
    def calculate_severity(risk_score: float) -> str:
        # Normalize score if passed on 0-100 scale instead of 0-1
        score = risk_score / 100.0 if risk_score > 1.0 else risk_score
        
        if score >= 0.90:
            return "Critical"
        elif score >= 0.75:
            return "High"
        elif score >= 0.50:
            return "Medium"
        else:
            return "Low"

    @classmethod
    def process_prediction_alert(
        cls,
        db: Database,
        claim_id: str,
        prediction_id: str,
        provider: str,
        claim_amount: float,
        risk_score: float,
        operator_email: str = "system"
    ) -> str | None:
        # Double check for unique constraint manually to avoid errors
        existing = db["alerts"].find_one({"claim_id": claim_id})
        if existing:
            return str(existing["_id"])

        severity = cls.calculate_severity(risk_score)
        alert = Alert(
            claim_id=claim_id,
            prediction_id=prediction_id,
            provider=provider,
            claim_amount=claim_amount,
            risk_score=risk_score if risk_score <= 1.0 else (risk_score / 100.0),
            severity=severity,
            status="New",
            notes=[],
            created_by=operator_email
        )
        
        alert_id = AlertRepository.create_alert(db, alert)
        cls.log_audit_event(db, "ALERT_CREATED", alert_id, operator_email)
        return alert_id

    @classmethod
    def update_alert_status(cls, db: Database, alert_id: str, status: str, operator_email: str) -> dict:
        alert = AlertRepository.get_alert_by_id(db, alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Validations for status transition
        valid_statuses = {"New", "Under Review", "Investigating", "Resolved"}
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
            
        current_status = alert["status"]
        if current_status == "Resolved" and status == "New":
            raise HTTPException(
                status_code=400,
                detail="Cannot revert resolved alert to New status directly. Choose Under Review or Investigating."
            )

        updated_at = datetime.now(timezone.utc)
        success = AlertRepository.update_status(db, alert_id, status, updated_at)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update alert status")

        cls.log_audit_event(db, "ALERT_STATUS_CHANGED", alert_id, operator_email)
        return AlertRepository.get_alert_by_id(db, alert_id)

    @classmethod
    def create_note(cls, db: Database, alert_id: str, note_text: str, operator_email: str) -> dict:
        alert = AlertRepository.get_alert_by_id(db, alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        note = AlertNote(
            text=note_text.strip(),
            date=datetime.now(timezone.utc),
            analyst=operator_email
        ).model_dump()

        updated_at = datetime.now(timezone.utc)
        success = AlertRepository.add_note(db, alert_id, note, updated_at)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to append note")

        cls.log_audit_event(db, "ALERT_NOTE_ADDED", alert_id, operator_email)
        return AlertRepository.get_alert_by_id(db, alert_id)

    @classmethod
    def delete_alert_and_log(cls, db: Database, alert_id: str, operator_email: str) -> None:
        alert = AlertRepository.get_alert_by_id(db, alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        success = AlertRepository.delete_alert(db, alert_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete alert")

        cls.log_audit_event(db, "ALERT_DELETED", alert_id, operator_email)

    @staticmethod
    def log_audit_event(db: Database, action_type: str, target_id: str, operator_email: str) -> None:
        from app.services.audit_service import AuditService
        
        # Determine entity type, action, and description based on action_type
        entity_type = "ALERT"
        action = "UPDATE"
        description = f"Alert action {action_type} performed."
        
        if action_type == "ALERT_CREATED":
            action = "CREATE"
            description = "Fraud alert initialized from prediction result."
        elif action_type == "ALERT_STATUS_CHANGED":
            action = "UPDATE"
            description = "Alert workflow status updated."
        elif action_type == "ALERT_NOTE_ADDED":
            action = "UPDATE"
            description = "Analyst comment added to alert."
        elif action_type == "ALERT_DELETED":
            action = "DELETE"
            description = "Alert was deleted from the system."

        AuditService.log_event(
            db=db,
            event_type=action_type,
            entity_type=entity_type,
            entity_id=target_id,
            action=action,
            description=description,
            performed_by=operator_email,
            metadata={"source": "alert_service"}
        )

    @staticmethod
    def get_alerts(
        db: Database,
        search: str = None,
        status: str = None,
        severity: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_dir: int = -1
    ) -> tuple[int, list]:
        return AlertRepository.get_alerts(db, search, status, severity, skip, limit, sort_by, sort_dir)
