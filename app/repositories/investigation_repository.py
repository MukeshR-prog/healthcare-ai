from datetime import datetime
from bson import ObjectId
from pymongo.database import Database
from app.models.investigation import Investigation


class InvestigationRepository:
    @staticmethod
    def create_case(db: Database, case: Investigation) -> str:
        payload = case.model_dump(by_alias=True, exclude={"id"})
        result = db["investigations"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def get_case_by_id(db: Database, case_id: str) -> dict | None:
        if not ObjectId.is_valid(case_id):
            return None
        
        pipeline = [
            {"$match": {"_id": ObjectId(case_id)}},
            {
                "$lookup": {
                    "from": "investigation_notes",
                    "let": {"case_id_obj": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$case_id", {"$toString": "$$case_id_obj"}]}}},
                        {"$sort": {"created_at": -1}}
                    ],
                    "as": "notes"
                }
            },
            {
                "$lookup": {
                    "from": "investigation_timeline",
                    "let": {"case_id_obj": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$case_id", {"$toString": "$$case_id_obj"}]}}},
                        {"$sort": {"created_at": 1}}
                    ],
                    "as": "timeline"
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "id": {"$toString": "$_id"},
                    "case_id": 1,
                    "alert_id": 1,
                    "claim_id": 1,
                    "provider": 1,
                    "claim_amount": 1,
                    "risk_score": 1,
                    "severity": 1,
                    "status": 1,
                    "priority": 1,
                    "assigned_to": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "created_by": 1,
                    "notes": 1,
                    "timeline": 1
                }
            }
        ]
        results = list(db["investigations"].aggregate(pipeline))
        return results[0] if results else None

    @staticmethod
    def get_cases(
        db: Database,
        search: str = None,
        status: str = None,
        priority: str = None,
        assigned_to: str = None,
        skip: int = 0,
        limit: int = 10,
        sort_by: str = "created_at",
        sort_dir: int = -1
    ) -> tuple[int, list]:
        query = {}
        if status and status != "All":
            query["status"] = status
        if priority and priority != "All":
            query["priority"] = priority
        if assigned_to and assigned_to != "All":
            query["assigned_to"] = assigned_to
        if search:
            or_conditions = [
                {"provider": {"$regex": search, "$options": "i"}},
                {"case_id": {"$regex": search, "$options": "i"}},
                {"assigned_to": {"$regex": search, "$options": "i"}}
            ]
            if len(search) == 24 and all(c in "0123456789abcdef" for c in search.lower()):
                or_conditions.append({"_id": ObjectId(search)})
            query["$or"] = or_conditions

        total = db["investigations"].count_documents(query)

        sort_field = "created_at"
        if sort_by == "riskScore":
            sort_field = "risk_score"
        elif sort_by == "amount":
            sort_field = "claim_amount"
        elif sort_by == "case_id":
            sort_field = "case_id"
        elif sort_by == "provider":
            sort_field = "provider"
        elif sort_by == "status":
            sort_field = "status"
        elif sort_by == "priority":
            sort_field = "priority"
        elif sort_by == "assigned_to":
            sort_field = "assigned_to"

        pipeline = [
            {"$match": query},
            {"$sort": {sort_field: sort_dir}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "investigation_notes",
                    "let": {"case_id_obj": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$case_id", {"$toString": "$$case_id_obj"}]}}},
                        {"$sort": {"created_at": -1}}
                    ],
                    "as": "notes"
                }
            },
            {
                "$lookup": {
                    "from": "investigation_timeline",
                    "let": {"case_id_obj": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$case_id", {"$toString": "$$case_id_obj"}]}}},
                        {"$sort": {"created_at": 1}}
                    ],
                    "as": "timeline"
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "id": {"$toString": "$_id"},
                    "case_id": 1,
                    "alert_id": 1,
                    "claim_id": 1,
                    "provider": 1,
                    "claim_amount": 1,
                    "risk_score": 1,
                    "severity": 1,
                    "status": 1,
                    "priority": 1,
                    "assigned_to": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "created_by": 1,
                    "notes": 1,
                    "timeline": 1
                }
            }
        ]
        items = list(db["investigations"].aggregate(pipeline))
        return total, items

    @staticmethod
    def update_status(db: Database, case_id: str, status: str, updated_at: datetime) -> bool:
        if not ObjectId.is_valid(case_id):
            return False
        result = db["investigations"].update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": status, "updated_at": updated_at}}
        )
        return result.modified_count > 0

    @staticmethod
    def update_assignment(db: Database, case_id: str, assigned_to: str, priority: str, updated_at: datetime) -> bool:
        if not ObjectId.is_valid(case_id):
            return False
        result = db["investigations"].update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"assigned_to": assigned_to, "priority": priority, "updated_at": updated_at}}
        )
        return result.modified_count > 0

    @staticmethod
    def add_note(db: Database, note_doc: dict) -> bool:
        result = db["investigation_notes"].insert_one(note_doc)
        return result.inserted_id is not None

    @staticmethod
    def add_timeline_event(db: Database, event_doc: dict) -> bool:
        result = db["investigation_timeline"].insert_one(event_doc)
        return result.inserted_id is not None

    @staticmethod
    def get_notes(db: Database, case_id: str) -> list:
        return list(db["investigation_notes"].find({"case_id": case_id}).sort("created_at", -1))

    @staticmethod
    def get_timeline(db: Database, case_id: str) -> list:
        return list(db["investigation_timeline"].find({"case_id": case_id}).sort("created_at", 1))

    @staticmethod
    def delete_case(db: Database, case_id: str) -> bool:
        if not ObjectId.is_valid(case_id):
            return False
        result = db["investigations"].delete_one({"_id": ObjectId(case_id)})
        return result.deleted_count > 0
