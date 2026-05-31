from datetime import datetime, timezone
from pymongo.database import Database
from app.models.audit_log import AuditLog
from app.repositories.audit_repository import AuditRepository


class AuditService:
    @staticmethod
    def log_event(
        db: Database,
        event_type: str,
        entity_type: str,
        entity_id: str,
        action: str,
        description: str,
        performed_by: str,
        metadata: dict = None
    ) -> str:
        log = AuditLog(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            performed_by=performed_by,
            metadata=metadata or {},
            created_at=datetime.now(timezone.utc)
        )
        return AuditRepository.create_log(db, log)
