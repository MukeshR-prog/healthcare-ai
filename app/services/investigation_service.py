from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database
from app.models.investigation import Investigation, InvestigationNote, InvestigationTimeline
from app.repositories.investigation_repository import InvestigationRepository
from app.repositories.alert_repository import AlertRepository
from app.services.alert_service import AlertService


class InvestigationService:
    @classmethod
    def create_case(
        cls,
        db: Database,
        alert_id: str,
        assigned_to: str = "Unassigned",
        priority: str = "Medium",
        operator_email: str = "system"
    ) -> str:
        # 1. Check if case already exists for this alert
        existing = db["investigations"].find_one({"alert_id": alert_id})
        if existing:
            raise HTTPException(status_code=400, detail="An investigation case already exists for this alert.")

        # 2. Fetch linked alert
        alert = AlertRepository.get_alert_by_id(db, alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Linked alert not found.")

        # 3. Calculate sequential CASE-99001 format ID
        count = db["investigations"].count_documents({})
        case_id = f"CASE-99{str(count + 1).zfill(3)}"

        # 4. Insert new investigation case
        investigation = Investigation(
            case_id=case_id,
            alert_id=alert_id,
            claim_id=alert["claim_id"],
            provider=alert["provider"],
            claim_amount=alert["claim_amount"],
            risk_score=alert["risk_score"],
            severity=alert["severity"],
            status="New",
            priority=priority,
            assigned_to=assigned_to,
            created_by=operator_email
        )
        
        inserted_id = InvestigationRepository.create_case(db, investigation)

        # 5. Automatically transition alert status to Under Review
        if alert["status"] == "New":
            AlertService.update_alert_status(db, alert_id, "Under Review", operator_email)

        # 6. Create timeline CASE_CREATED event
        cls.add_timeline_event(
            db,
            case_id=inserted_id,
            event_type="New",
            description="Investigation case initialized from fraud alert.",
            operator_email=operator_email
        )

        # 7. Convert and import any notes that are already stored in the alert
        if alert.get("notes"):
            cls.add_note(db, inserted_id, alert["notes"], "System")

        # 8. Log audit log record
        cls.log_audit_event(db, "CASE_CREATED", case_id, operator_email)

        return inserted_id

    @classmethod
    def update_case_status(
        cls,
        db: Database,
        case_id: str,
        status: str,
        description: str | None,
        operator_email: str
    ) -> dict:
        case = InvestigationRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        current_status = case["status"]
        if current_status == status:
            return case

        # Validate workflow transition
        valid_transitions = {
            "New": {"Under Review"},
            "Under Review": {"Investigating"},
            "Investigating": {"Escalated", "Confirmed Fraud"},
            "Confirmed Fraud": {"Closed"},
            "Escalated": {"Closed"}
        }

        allowed = valid_transitions.get(current_status, set())
        if status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid workflow status transition from {current_status} to {status}."
            )

        updated_at = datetime.now(timezone.utc)
        success = InvestigationRepository.update_status(db, case_id, status, updated_at)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update case status.")

        # Add to timeline log
        title_map = {
            "New": "Case Created",
            "Under Review": "Review Started",
            "Investigating": "Investigation Started",
            "Escalated": "Case Escalated",
            "Confirmed Fraud": "Fraud Confirmed",
            "Closed": "Case Closed"
        }
        
        event_title = title_map.get(status, status)
        event_desc = description or f"Status transitioned to {status} by analyst {operator_email}."
        
        cls.add_timeline_event(
            db,
            case_id=case_id,
            event_type=status,
            description=event_desc,
            operator_email=operator_email
        )

        # Audit events
        audit_type = "CASE_STATUS_CHANGED"
        if status == "Closed":
            audit_type = "CASE_CLOSED"
        cls.log_audit_event(db, audit_type, case["case_id"], operator_email)

        return InvestigationRepository.get_case_by_id(db, case_id)

    @classmethod
    def update_case_assignment(
        cls,
        db: Database,
        case_id: str,
        assigned_to: str,
        priority: str,
        operator_email: str
    ) -> dict:
        case = InvestigationRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        current_assignee = case["assigned_to"]
        current_priority = case["priority"]

        if current_assignee == assigned_to and current_priority == priority:
            return case

        updated_at = datetime.now(timezone.utc)
        success = InvestigationRepository.update_assignment(db, case_id, assigned_to, priority, updated_at)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update case metadata.")

        # Event logs
        if current_assignee != assigned_to:
            cls.add_timeline_event(
                db,
                case_id=case_id,
                event_type=case["status"],
                description=f"Assigned to {assigned_to} with {priority} priority by {operator_email}.",
                operator_email=operator_email
            )
            cls.log_audit_event(db, "CASE_ASSIGNED", case["case_id"], operator_email)
        elif current_priority != priority:
            cls.add_timeline_event(
                db,
                case_id=case_id,
                event_type=case["status"],
                description=f"Priority updated to {priority} level by {operator_email}.",
                operator_email=operator_email
            )
            cls.log_audit_event(db, "CASE_PRIORITY_UPDATED", case["case_id"], operator_email)

        return InvestigationRepository.get_case_by_id(db, case_id)

    @classmethod
    def add_note(cls, db: Database, case_id: str, text: str, operator_email: str) -> dict:
        case = InvestigationRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        note = InvestigationNote(
            case_id=case_id,
            author=operator_email,
            note=text.strip()
        )
        
        success = InvestigationRepository.add_note(db, note.model_dump(by_alias=True, exclude={"id"}))
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save analyst comment.")

        # Timeline event
        cls.add_timeline_event(
            db,
            case_id=case_id,
            event_type=case["status"],
            description=f"Analyst {operator_email} recorded a new investigation note.",
            operator_email=operator_email
        )

        cls.log_audit_event(db, "CASE_NOTE_ADDED", case["case_id"], operator_email)
        return InvestigationRepository.get_case_by_id(db, case_id)

    @classmethod
    def delete_case_and_log(cls, db: Database, case_id: str, operator_email: str) -> None:
        case = InvestigationRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        # Delete from all collections
        db["investigation_notes"].delete_many({"case_id": case_id})
        db["investigation_timeline"].delete_many({"case_id": case_id})
        
        success = InvestigationRepository.delete_case(db, case_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete case.")

        cls.log_audit_event(db, "CASE_DELETED", case["case_id"], operator_email)

    @classmethod
    def add_timeline_event(
        cls,
        db: Database,
        case_id: str,
        event_type: str,
        description: str,
        operator_email: str
    ) -> None:
        event = InvestigationTimeline(
            case_id=case_id,
            event_type=event_type,
            description=description,
            created_by=operator_email
        )
        InvestigationRepository.add_timeline_event(db, event.model_dump(by_alias=True, exclude={"id"}))

    @staticmethod
    def aggregate_metrics(db: Database) -> dict:
        # Aggregation facets pipeline
        pipeline = [
            {
                "$facet": {
                    "total": [{"$count": "count"}],
                    "open": [
                        {"$match": {"status": {"$nin": ["Closed", "Confirmed Fraud"]}}},
                        {"$count": "count"}
                    ],
                    "review": [
                        {"$match": {"status": "Under Review"}},
                        {"$count": "count"}
                    ],
                    "resolved": [
                        {"$match": {"status": {"$in": ["Closed", "Confirmed Fraud"]}}},
                        {"$count": "count"}
                    ]
                }
            }
        ]
        
        results = list(db["investigations"].aggregate(pipeline))
        facet = results[0] if results else {}
        
        total = facet.get("total", [])
        open_cases = facet.get("open", [])
        review = facet.get("review", [])
        resolved = facet.get("resolved", [])

        return {
            "total": total[0]["count"] if total else 0,
            "open": open_cases[0]["count"] if open_cases else 0,
            "review": review[0]["count"] if review else 0,
            "resolved": resolved[0]["count"] if resolved else 0
        }

    @staticmethod
    def log_audit_event(db: Database, action_type: str, target_id: str, operator_email: str) -> None:
        from app.services.audit_service import AuditService
        
        # Determine action and description based on investigation action_type
        entity_type = "INVESTIGATION"
        action = "UPDATE"
        description = f"Investigation action {action_type} performed."
        
        if action_type == "CASE_CREATED":
            action = "CREATE"
            description = "Investigation case initialized from fraud alert."
        elif action_type == "CASE_ASSIGNED":
            action = "UPDATE"
            description = "Investigation case assignment updated."
        elif action_type == "CASE_STATUS_CHANGED":
            action = "UPDATE"
            description = "Investigation workflow status transitioned."
        elif action_type == "CASE_NOTE_ADDED":
            action = "UPDATE"
            description = "Analyst investigation note recorded."
        elif action_type == "CASE_CLOSED":
            action = "UPDATE"
            description = "Investigation case resolved and closed."
        elif action_type == "CASE_PRIORITY_UPDATED":
            action = "UPDATE"
            description = "Investigation case priority level changed."
        elif action_type == "CASE_DELETED":
            action = "DELETE"
            description = "Investigation case removed from system."

        AuditService.log_event(
            db=db,
            event_type=action_type,
            entity_type=entity_type,
            entity_id=target_id,
            action=action,
            description=description,
            performed_by=operator_email,
            metadata={"source": "investigation_service"}
        )

    @staticmethod
    def get_cases(
        db: Database,
        search: str = None,
        status: str = None,
        priority: str = None,
        assigned_to: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_dir: int = -1
    ) -> tuple[int, list]:
        from app.repositories.investigation_repository import InvestigationRepository
        return InvestigationRepository.get_cases(db, search, status, priority, assigned_to, skip, limit, sort_by, sort_dir)
