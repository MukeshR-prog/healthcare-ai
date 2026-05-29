from datetime import datetime
from bson import ObjectId
from pymongo.database import Database
from app.models.alert import Alert


class AlertRepository:
    @staticmethod
    def create_alert(db: Database, alert: Alert) -> str:
        payload = alert.model_dump(by_alias=True, exclude={"id"})
        result = db["alerts"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_alert_by_id(db: Database, alert_id: str) -> dict | None:
        if not ObjectId.is_valid(alert_id):
            return None
        
        # Pipeline for dynamic claims aggregation
        pipeline = [
            {"$match": {"_id": ObjectId(alert_id)}},
            {
                "$lookup": {
                    "from": "claims",
                    "let": {"claim_id_obj": {"$toObjectId": "$claim_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$claim_id_obj"]}}}
                    ],
                    "as": "claim_info"
                }
            },
            {"$unwind": {"path": "$claim_info", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "claim_id": 1,
                    "prediction_id": 1,
                    "provider": 1,
                    "claim_amount": 1,
                    "risk_score": 1,
                    "severity": 1,
                    "status": 1,
                    "notes": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "created_by": 1,
                    "procedures": {"$ifNull": ["$claim_info.num_procedures", 1]},
                    "gender": {"$ifNull": ["$claim_info.gender", "O"]}
                }
            }
        ]
        results = list(db["alerts"].aggregate(pipeline))
        return results[0] if results else None

    @staticmethod
    def get_alerts(
        db: Database,
        search: str = None,
        status: str = None,
        severity: str = None,
        skip: int = 0,
        limit: int = 10,
        sort_by: str = "created_at",
        sort_dir: int = -1
    ) -> tuple[int, list]:
        query = {}
        if status and status != "All":
            query["status"] = status
        if severity and severity != "All":
            query["severity"] = severity
        if search:
            or_conditions = [
                {"provider": {"$regex": search, "$options": "i"}},
                {"claim_id": {"$regex": search, "$options": "i"}}
            ]
            if len(search) == 24 and all(c in "0123456789abcdef" for c in search.lower()):
                or_conditions.append({"_id": ObjectId(search)})
            query["$or"] = or_conditions

        total = db["alerts"].count_documents(query)

        sort_field = "created_at"
        if sort_by == "riskScore":
            sort_field = "risk_score"
        elif sort_by == "amount":
            sort_field = "claim_amount"

        pipeline = [
            {"$match": query},
            {"$sort": {sort_field: sort_dir}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "claims",
                    "let": {"claim_id_obj": {"$toObjectId": "$claim_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$claim_id_obj"]}}}
                    ],
                    "as": "claim_info"
                }
            },
            {"$unwind": {"path": "$claim_info", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "claim_id": 1,
                    "prediction_id": 1,
                    "provider": 1,
                    "claim_amount": 1,
                    "risk_score": 1,
                    "severity": 1,
                    "status": 1,
                    "notes": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "created_by": 1,
                    "procedures": {"$ifNull": ["$claim_info.num_procedures", 1]},
                    "gender": {"$ifNull": ["$claim_info.gender", "O"]}
                }
            }
        ]
        items = list(db["alerts"].aggregate(pipeline))
        return total, items

    @staticmethod
    def update_status(db: Database, alert_id: str, status: str, updated_at: datetime) -> bool:
        if not ObjectId.is_valid(alert_id):
            return False
        result = db["alerts"].update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"status": status, "updated_at": updated_at}}
        )
        return result.modified_count > 0

    @staticmethod
    def add_note(db: Database, alert_id: str, note: dict, updated_at: datetime) -> bool:
        if not ObjectId.is_valid(alert_id):
            return False
        result = db["alerts"].update_one(
            {"_id": ObjectId(alert_id)},
            {
                "$push": {"notes": note},
                "$set": {"updated_at": updated_at}
            }
        )
        return result.modified_count > 0

    @staticmethod
    def delete_alert(db: Database, alert_id: str) -> bool:
        if not ObjectId.is_valid(alert_id):
            return False
        result = db["alerts"].delete_one({"_id": ObjectId(alert_id)})
        return result.deleted_count > 0
