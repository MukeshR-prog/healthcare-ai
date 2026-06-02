from datetime import datetime, timezone
from bson import ObjectId
from pymongo.database import Database
from app.models.document import Document, OCRExtraction, VerificationResult


class DocumentRepository:
    @staticmethod
    def create_document(db: Database, document: Document) -> str:
        payload = document.model_dump(by_alias=True, exclude={"id"})
        result = db["documents"].insert_one(payload)
        return str(result.inserted_id)

    @staticmethod
    def save_extraction(db: Database, extraction: OCRExtraction) -> None:
        payload = extraction.model_dump(by_alias=True, exclude={"id"})
        db["ocr_extractions"].update_one(
            {"document_id": extraction.document_id},
            {"$set": payload},
            upsert=True
        )

    @staticmethod
    def save_verification(db: Database, verification: VerificationResult) -> None:
        payload = verification.model_dump(by_alias=True, exclude={"id"})
        db["verification_results"].update_one(
            {"document_id": verification.document_id},
            {"$set": payload},
            upsert=True
        )

    @staticmethod
    def add_note(db: Database, document_id: str, note: dict) -> dict | None:
        db["documents"].update_one(
            {"document_id": document_id},
            {"$push": {"notes": note}}
        )
        return DocumentRepository.get_document(db, document_id)

    @staticmethod
    def get_document_raw(db: Database, document_id: str) -> dict | None:
        return db["documents"].find_one({"document_id": document_id})

    @staticmethod
    def get_document(db: Database, document_id: str) -> dict | None:
        pipeline = DocumentRepository._get_base_pipeline(document_id=document_id)
        results = list(db["documents"].aggregate(pipeline))
        return results[0] if results else None

    @staticmethod
    def get_documents(
        db: Database,
        search: str = None,
        status: str = None,
        risk_level: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "uploaded_at",
        sort_dir: int = -1
    ) -> tuple[int, list[dict]]:
        query_pipeline = DocumentRepository._get_base_pipeline(
            search=search, status=status, risk_level=risk_level
        )

        # Count total documents matching filters
        count_pipeline = list(query_pipeline)
        count_pipeline.append({"$count": "total"})
        count_res = list(db["documents"].aggregate(count_pipeline))
        total = count_res[0]["total"] if count_res else 0

        # Apply paging & sorting
        sort_field = "uploaded_at"
        if sort_by == "claimAmount":
            sort_field = "claim_amount"
        elif sort_by == "created_at":
            sort_field = "uploaded_at"

        query_pipeline.append({"$sort": {sort_field: sort_dir}})
        query_pipeline.append({"$skip": skip})
        query_pipeline.append({"$limit": limit})

        items = list(db["documents"].aggregate(query_pipeline))
        return total, items

    @staticmethod
    def delete_document(db: Database, document_id: str) -> bool:
        db["ocr_extractions"].delete_many({"document_id": document_id})
        db["verification_results"].delete_many({"document_id": document_id})
        res = db["documents"].delete_one({"document_id": document_id})
        return res.deleted_count > 0

    @staticmethod
    def _get_base_pipeline(
        document_id: str = None,
        search: str = None,
        status: str = None,
        risk_level: str = None
    ) -> list[dict]:
        pipeline = []

        # Match specific doc_id if provided
        if document_id:
            pipeline.append({"$match": {"document_id": document_id}})

        # Lookup OCR extractions
        pipeline.append({
            "$lookup": {
                "from": "ocr_extractions",
                "localField": "document_id",
                "foreignField": "document_id",
                "as": "ocr"
            }
        })
        pipeline.append({"$unwind": {"path": "$ocr", "preserveNullAndEmptyArrays": True}})

        # Lookup verification results
        pipeline.append({
            "$lookup": {
                "from": "verification_results",
                "localField": "document_id",
                "foreignField": "document_id",
                "as": "verification"
            }
        })
        pipeline.append({"$unwind": {"path": "$verification", "preserveNullAndEmptyArrays": True}})

        # Build filter match query stage
        match_stage = {}
        if search:
            match_stage["$or"] = [
                {"document_id": {"$regex": search, "$options": "i"}},
                {"file_name": {"$regex": search, "$options": "i"}},
                {"ocr.patient_name": {"$regex": search, "$options": "i"}},
                {"ocr.provider_name": {"$regex": search, "$options": "i"}}
            ]
        if status and status != "All":
            match_stage["status"] = status
        if risk_level and risk_level != "All":
            match_stage["verification.risk_level"] = risk_level

        if match_stage:
            pipeline.append({"$match": match_stage})

        # Unified Document mapping projection
        pipeline.append({
            "$project": {
                "_id": 0,
                "id": "$document_id",
                "document_id": 1,
                "file_name": 1,
                "file_type": 1,
                "file_size": 1,
                "uploaded_by": 1,
                "uploaded_at": 1,
                "created_at": "$uploaded_at",
                "status": 1,
                "notes": 1,
                "risk_level": {"$ifNull": ["$verification.risk_level", "Low"]},
                "patient_name": {"$ifNull": ["$ocr.patient_name", ""]},
                "provider_name": {"$ifNull": ["$ocr.provider_name", ""]},
                "claim_amount": {"$ifNull": ["$ocr.claim_amount", 0.0]},
                "date_of_service": {
                    "$ifNull": [
                        {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$ocr.date_of_service"
                            }
                        },
                        ""
                    ]
                },
                "diagnosis_code": {"$ifNull": ["$ocr.diagnosis_code", ""]},
                "procedure_code": {"$ifNull": ["$ocr.procedure_code", ""]},
                "verification": {
                    "$cond": [
                        {"$gt": ["$verification", None]},
                        {
                            "id": {"$toString": "$verification._id"},
                            "document_id": "$verification.document_id",
                            "verification_score": "$verification.verification_score",
                            "risk_level": "$verification.risk_level",
                            "mismatch_count": "$verification.mismatch_count",
                            "status": "$verification.status",
                            "checks": "$verification.checks",
                            "claim_values": "$verification.claim_values",
                            "created_at": "$verification.created_at"
                        },
                        None
                    ]
                }
            }
        })

        return pipeline
