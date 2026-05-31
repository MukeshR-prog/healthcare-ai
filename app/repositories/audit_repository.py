from datetime import datetime
from bson import ObjectId
from pymongo.database import Database
from app.models.audit_log import AuditLog


class AuditRepository:
    @staticmethod
    def create_log(db: Database, log: AuditLog) -> str:
        payload = log.model_dump(by_alias=True, exclude={"id"})
        result = db["audit_logs"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_log_by_id(db: Database, log_id: str) -> dict | None:
        if not ObjectId.is_valid(log_id):
            return None
        doc = db["audit_logs"].find_one({"_id": ObjectId(log_id)})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    @staticmethod
    def count_logs(db: Database, query: dict) -> int:
        return db["audit_logs"].count_documents(query)

    @staticmethod
    def get_logs(
        db: Database,
        event_type: str = None,
        entity_type: str = None,
        performed_by: str = None,
        start_date: datetime = None,
        end_date: datetime = None,
        skip: int = 0,
        limit: int = 10,
        sort_by: str = "created_at",
        sort_dir: int = -1
    ) -> tuple[int, list[dict]]:
        query = {}
        if event_type:
            query["event_type"] = event_type
        if entity_type:
            query["entity_type"] = entity_type
        if performed_by:
            query["performed_by"] = performed_by
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["created_at"] = date_filter

        total = db["audit_logs"].count_documents(query)

        sort_field = "created_at"
        if sort_by:
            sort_field = sort_by

        cursor = db["audit_logs"].find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
        items = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            items.append(doc)

        return total, items

    @staticmethod
    def get_metrics(db: Database) -> dict:
        pipeline = [
            {
                "$facet": {
                    "total": [{"$count": "count"}],
                    "alert": [{"$match": {"entity_type": "ALERT"}}, {"$count": "count"}],
                    "investigation": [{"$match": {"entity_type": "INVESTIGATION"}}, {"$count": "count"}],
                    "provider": [{"$match": {"entity_type": "PROVIDER"}}, {"$count": "count"}],
                    "document": [{"$match": {"entity_type": "DOCUMENT"}}, {"$count": "count"}],
                }
            }
        ]
        results = list(db["audit_logs"].aggregate(pipeline))
        facet = results[0] if results else {}

        total = facet.get("total", [])
        alert = facet.get("alert", [])
        investigation = facet.get("investigation", [])
        provider = facet.get("provider", [])
        document = facet.get("document", [])

        return {
            "total_events": total[0]["count"] if total else 0,
            "alert_actions": alert[0]["count"] if alert else 0,
            "investigation_actions": investigation[0]["count"] if investigation else 0,
            "provider_actions": provider[0]["count"] if provider else 0,
            "document_actions": document[0]["count"] if document else 0,
        }
